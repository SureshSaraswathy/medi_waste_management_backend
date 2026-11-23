import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { isAbsolute, join, normalize, resolve, sep } from 'path';

/**
 * Disk-backed file storage rooted at UPLOAD_DIR (default: ./storage/uploads).
 * Only RELATIVE paths are stored in the database, so the root can move between environments.
 */
@Injectable()
export class FileStorageService implements OnModuleInit {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly root: string;

  constructor(configService: ConfigService) {
    const configured = configService.get<string>('app.uploadDir') || './storage/uploads';
    // resolve() normalises separators, "..", "." and a trailing slash, so the containment check in abs() compares like with like
    // (an UPLOAD_DIR such as "/var/app/uploads/" or "D:/data/uploads" would otherwise make every file operation fail with 404).
    this.root = isAbsolute(configured) ? resolve(configured) : resolve(process.cwd(), configured);
  }

  /**
   * Start-up self-check of the configured storage folder: it is created when missing and a write/read/delete probe
   * proves the runtime account has the permissions it needs. It never stops the application (logo features simply
   * report errors), but a misconfigured folder shows up in the log immediately instead of at the first upload.
   */
  async onModuleInit(): Promise<void> {
    const probe = join(this.root, `.write-probe-${process.pid}-${Date.now()}`);
    try {
      await fs.mkdir(this.root, { recursive: true, mode: 0o750 });
      await fs.writeFile(probe, 'ok', { mode: 0o640 });
      const back = await fs.readFile(probe, 'utf8');
      await fs.unlink(probe);
      if (back !== 'ok') throw new Error('read-back mismatch');
      this.logger.log(`upload folder ready: ${this.root} (create/write/read/delete verified for the runtime account)`);
    } catch (err: any) {
      this.logger.error(`upload folder ${this.root} is NOT usable by the runtime account (${err?.code || err?.message}). Logo upload will fail until it exists and is writable.`);
      try { await fs.unlink(probe); } catch { /* nothing to remove */ }
    }
  }

  /** The resolved storage root (for diagnostics and tests). */
  get rootPath(): string {
    return this.root;
  }

  /** Resolve a stored relative path to an absolute path, refusing anything outside the root. */
  private safeResolve(relativePath: string): string {
    const abs = resolve(this.root, normalize(relativePath));
    if (abs !== this.root && !abs.startsWith(this.root + sep)) {
      throw new NotFoundException('File not found');
    }
    return abs;
  }

  /**
   * Save a logo. The file name contains a content hash so a replaced logo gets a new
   * URL (cache-busting) and never overwrites an existing file.
   * @returns relative path (posix style) to store in the DB
   */
  async saveLogo(dir: string, baseName: string, ext: string, data: Buffer): Promise<string> {
    const hash = createHash('sha1').update(data).digest('hex').slice(0, 12);
    const relative = join(dir, `${baseName}-${hash}.${ext}`).split(sep).join('/');
    const abs = this.safeResolve(relative);
    // owner read/write (+ group read) only: uploaded files are never executable and never world-readable
    await fs.mkdir(join(abs, '..'), { recursive: true, mode: 0o750 });
    await fs.writeFile(abs, data, { mode: 0o640 });
    return relative;
  }

  async read(relativePath: string): Promise<Buffer> {
    const abs = this.safeResolve(relativePath);
    try {
      return await fs.readFile(abs);
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  /** Delete a single file. Never throws (a missing file is fine). */
  async deleteFile(relativePath?: string | null): Promise<void> {
    if (!relativePath) return;
    try {
      await fs.unlink(this.safeResolve(relativePath));
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        this.logger.warn(`Could not delete ${relativePath}: ${err?.message}`);
      }
    }
  }
}
