import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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

@Injectable()
export class InvoiceBulkDownloadService {
  private readonly logger = new Logger(InvoiceBulkDownloadService.name);
  private readonly baseDir = path.join(process.cwd(), 'storage', 'bulk-invoice-zips');
  private readonly TTL_MS = 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(BulkDownloadEntity, 'transaction')
    private readonly bulkDownloadRepository: Repository<BulkDownloadEntity>,
  ) {}

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

