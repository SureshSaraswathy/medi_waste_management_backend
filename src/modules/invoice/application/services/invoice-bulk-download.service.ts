import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export type BulkZipMetadata = {
  token: string;
  jobId: string;
  email: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  expiresAt: string;
};

@Injectable()
export class InvoiceBulkDownloadService {
  private readonly baseDir = path.join(process.cwd(), 'storage', 'bulk-invoice-zips');
  private readonly TTL_HOURS = 24;

  private tokenMetaPath(token: string) {
    return path.join(this.baseDir, `token-${token}.json`);
  }

  async saveZip(params: {
    jobId: string;
    email: string;
    buffer: Buffer;
    fileName?: string;
  }): Promise<BulkZipMetadata> {
    const token = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.TTL_HOURS * 60 * 60 * 1000);

    await fs.mkdir(this.baseDir, { recursive: true });

    const fileName = params.fileName || `bulk-invoices-${params.jobId}.zip`;
    const filePath = path.join(this.baseDir, `job-${params.jobId}-${fileName}`);

    await fs.writeFile(filePath, params.buffer);

    const meta: BulkZipMetadata = {
      token,
      jobId: params.jobId,
      email: params.email,
      fileName,
      filePath,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await fs.writeFile(this.tokenMetaPath(token), JSON.stringify(meta, null, 2), 'utf8');

    return meta;
  }

  async getByToken(token: string): Promise<BulkZipMetadata | null> {
    try {
      const raw = await fs.readFile(this.tokenMetaPath(token), 'utf8');
      const meta = JSON.parse(raw) as BulkZipMetadata;
      if (!meta?.filePath) return null;

      const exp = new Date(meta.expiresAt).getTime();
      if (!Number.isFinite(exp) || Date.now() > exp) {
        return null;
      }

      return meta;
    } catch {
      return null;
    }
  }
}

