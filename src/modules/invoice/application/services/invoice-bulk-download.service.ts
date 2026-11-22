import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { readZipManifest } from '../../../../common/utils/zip-manifest-reader.util';
import {
  BulkDownloadEntity,
  BulkDownloadStatus,
} from '../../infrastructure/transaction/bulk-download.entity';

export type BulkZipMetadata = {
  token: string;
  jobId: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  expiresAt: string;
};

export type BulkDownloadListItem = {
  id: string;
  jobId: string;
  token: string;
  filePath: string;
  createdAt: string;
  expireAt: string;
  downloadCount: number;
  status: BulkDownloadStatus;
};

export type BulkTokenValidationResult =
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'missing_file' }
  | {
      status: 'valid';
      record: BulkDownloadEntity;
      fileName: string;
    };

/** Result of resolveOwner(). */
export interface BulkOwner {
  established: boolean;
  companyId: string | null;
  source: 'RECORDED' | 'MANIFEST' | 'NONE';
  reason?: string;
}

@Injectable()
export class InvoiceBulkDownloadService {
  private readonly logger = new Logger(InvoiceBulkDownloadService.name);
  private readonly baseDir = path.join(process.cwd(), 'storage', 'bulk-invoice-zips');
  private readonly TTL_MS = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(BulkDownloadEntity, 'transaction')
    private readonly bulkDownloadRepository: Repository<BulkDownloadEntity>,
  ) {}

  /** Owners derived from legacy ZIP manifests (the file never changes, so the answer is stable). */
  private readonly derivedOwners = new Map<string, { at: number; value: BulkOwner }>();

  /**
   * Who owns this download? Recorded owner first. For legacy rows without an owner it is established ONLY when the
   * manifest inside the ZIP lists invoices that all exist and all belong to exactly one company. Anything else (no
   * manifest, unknown invoice, invoices of several companies, unreadable file) is "not established": callers must deny.
   * Nothing is written: records and files stay exactly as they are.
   */
  async resolveOwner(record: Pick<BulkDownloadEntity, 'id' | 'companyId' | 'filePath'>): Promise<BulkOwner> {
    if (record.companyId) return { established: true, companyId: record.companyId, source: 'RECORDED' };
    const hit = this.derivedOwners.get(record.id);
    if (hit && Date.now() - hit.at < 10 * 60_000) return hit.value;
    const value = await this.deriveOwner(record.filePath);
    if (this.derivedOwners.size > 500) this.derivedOwners.clear();
    this.derivedOwners.set(record.id, { at: Date.now(), value });
    return value;
  }

  private async deriveOwner(filePath: string): Promise<BulkOwner> {
    const no = (reason: string): BulkOwner => ({ established: false, companyId: null, source: 'NONE', reason });
    const manifest = await readZipManifest(filePath);
    const ids = manifest && Array.isArray(manifest.files) ? manifest.files.map((f) => f && f.invoiceId).filter(Boolean) as string[] : [];
    if (!manifest || ids.length === 0) return no('no readable manifest');
    const unique = [...new Set(ids)];
    try {
      const rows: Array<{ company_id: string | null }> = await this.bulkDownloadRepository.manager.query(
        'SELECT DISTINCT invoice_id, company_id FROM invoices WHERE invoice_id = ANY($1::uuid[])',
        [unique],
      );
      if (rows.length !== unique.length) return no('manifest lists invoices that no longer exist');
      const companies = [...new Set(rows.map((r) => r.company_id))];
      if (companies.length !== 1 || !companies[0]) return no('invoices belong to several companies or to none');
      return { established: true, companyId: companies[0], source: 'MANIFEST' };
    } catch (err: any) {
      this.logger.warn(`owner lookup failed: ${err?.message}`);
      return no('owner lookup failed');
    }
  }

  private buildUniqueFileName(jobId: string): string {
    return `job-${jobId}_${Date.now()}.zip`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async saveZip(params: {
    jobId: string;
    email: string;
    buffer: Buffer;
    fileName?: string;
    companyId?: string | null;
  }): Promise<BulkZipMetadata> {
    const token = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.TTL_MS);

    await fs.mkdir(this.baseDir, { recursive: true });

    // Required naming format: job-{jobId}_{timestamp}.zip
    const fileName = params.fileName || this.buildUniqueFileName(params.jobId);
    const uniqueName = this.buildUniqueFileName(params.jobId);
    const resolvedName = params.fileName ? uniqueName : fileName;
    const filePath = path.join(this.baseDir, resolvedName);

    await fs.writeFile(filePath, params.buffer);

    const record = this.bulkDownloadRepository.create({
      jobId: params.jobId,
      token,
      filePath,
      createdAt,
      expireAt: expiresAt,
      downloadCount: 0,
      status: BulkDownloadStatus.ACTIVE,
      companyId: params.companyId ?? null,
    });

    await this.bulkDownloadRepository.save(record);

    return {
      token,
      jobId: params.jobId,
      fileName: resolvedName,
      filePath,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  async validateToken(token: string): Promise<BulkTokenValidationResult> {
    const record = await this.bulkDownloadRepository.findOne({
      where: { token },
    });

    if (!record) {
      return { status: 'invalid' };
    }

    if (record.expireAt.getTime() <= Date.now()) {
      if (record.status !== BulkDownloadStatus.EXPIRED) {
        record.status = BulkDownloadStatus.EXPIRED;
        await this.bulkDownloadRepository.save(record);
      }
      return { status: 'expired' };
    }

    const exists = await this.fileExists(record.filePath);
    if (!exists) {
      if (record.status !== BulkDownloadStatus.MISSING_FILE) {
        record.status = BulkDownloadStatus.MISSING_FILE;
        await this.bulkDownloadRepository.save(record);
      }
      return { status: 'missing_file' };
    }

    if (record.status !== BulkDownloadStatus.ACTIVE) {
      record.status = BulkDownloadStatus.ACTIVE;
      await this.bulkDownloadRepository.save(record);
    }

    return {
      status: 'valid',
      record,
      fileName: path.basename(record.filePath),
    };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await this.bulkDownloadRepository.increment({ id }, 'downloadCount', 1);
  }

  async cleanupExpiredEntries(): Promise<{ removedRecords: number; removedFiles: number }> {
    const now = new Date();
    const expiredRecords = await this.bulkDownloadRepository.find({
      where: { expireAt: LessThan(now) },
    });

    let removedFiles = 0;

    for (const record of expiredRecords) {
      try {
        if (await this.fileExists(record.filePath)) {
          await fs.unlink(record.filePath);
          removedFiles++;
        }
      } catch (error) {
        this.logger.warn(`Failed deleting bulk ZIP file ${record.filePath}: ${String(error)}`);
      }
    }

    if (expiredRecords.length > 0) {
      await this.bulkDownloadRepository.delete({
        expireAt: LessThan(now),
      });
    }

    // Defensive cleanup for orphan files not represented in DB.
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      const files = await fs.readdir(this.baseDir);
      for (const file of files) {
        if (!file.endsWith('.zip')) continue;
        const fullPath = path.join(this.baseDir, file);
        const stat = await fs.stat(fullPath);
        if (stat.mtime.getTime() < now.getTime() - this.TTL_MS) {
          await fs.unlink(fullPath);
          removedFiles++;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed scanning bulk ZIP directory: ${String(error)}`);
    }

    return {
      removedRecords: expiredRecords.length,
      removedFiles,
    };
  }

  async listBulkDownloads(params?: {
    status?: BulkDownloadStatus;
    page?: number;
    pageSize?: number;
    /** limit to one customer's downloads (a download token is a credential: never list another customer's) */
    companyId?: string;
  }): Promise<{ items: BulkDownloadListItem[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params?.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, params?.pageSize ?? 20));

    const qb = this.bulkDownloadRepository
      .createQueryBuilder('bulk')
      .orderBy('bulk.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (params?.status) {
      qb.andWhere('bulk.status = :status', { status: params.status });
    }
    if (params?.companyId) {
      qb.andWhere('bulk.companyId = :companyId', { companyId: params.companyId });
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((row) => ({
        id: row.id,
        jobId: row.jobId,
        token: row.token,
        filePath: row.filePath,
        createdAt: row.createdAt.toISOString(),
        expireAt: row.expireAt.toISOString(),
        downloadCount: row.downloadCount,
        status: row.status,
      })),
      total,
      page,
      pageSize,
    };
  }
}

