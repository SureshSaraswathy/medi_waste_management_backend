import archiver from 'archiver';
import { PassThrough } from 'stream';

export interface ZipFileEntry {
  name: string;
  buffer: Buffer;
}

export interface ZipManifestEntry {
  fileName: string;
  invoiceId: string;
  hcfName?: string;
  invoiceNumber?: string;
  month?: number;
  year?: number;
  generatedAt: string;
}

export interface ZipOptions {
  includeManifest?: boolean;
  manifestData?: ZipManifestEntry[];
  compressionLevel?: number; // 0-9, default 6
}

/**
 * Utility class for generating ZIP files from multiple buffers
 */
export class ZipGenerator {
  /**
   * Generate a ZIP file from multiple file buffers
   * @param files Array of file entries with name and buffer
   * @param options Optional ZIP configuration
   * @returns Promise<Buffer> The ZIP file as a buffer
   * @throws Error if files array is empty or invalid
   */
  static async generateZipFromBuffers(
    files: ZipFileEntry[],
    options: ZipOptions = {},
  ): Promise<Buffer> {
    // Input validation
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('Files array cannot be empty. At least one file is required.');
    }

    // Validate each file entry
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) {
        throw new Error(`File entry at index ${i} is null or undefined.`);
      }
      if (!file.name || typeof file.name !== 'string' || file.name.trim() === '') {
        throw new Error(`File entry at index ${i} must have a valid name (non-empty string).`);
      }
      if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
        throw new Error(`File entry at index ${i} must have a valid Buffer.`);
      }
      if (file.buffer.length === 0) {
        throw new Error(`File entry at index ${i} has an empty buffer.`);
      }
    }

    // Validate compression level if provided
    if (options.compressionLevel !== undefined) {
      if (typeof options.compressionLevel !== 'number' || 
          options.compressionLevel < 0 || 
          options.compressionLevel > 9) {
        throw new Error('Compression level must be a number between 0 and 9.');
      }
    }

    // Validate manifest data if includeManifest is true
    if (options.includeManifest && !options.manifestData) {
      throw new Error('manifestData is required when includeManifest is true.');
    }

    if (options.includeManifest && options.manifestData) {
      if (!Array.isArray(options.manifestData)) {
        throw new Error('manifestData must be an array.');
      }
      if (options.manifestData.length !== files.length) {
        throw new Error(`manifestData length (${options.manifestData.length}) must match files length (${files.length}).`);
      }
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const passThrough = new PassThrough();

      // Collect chunks
      passThrough.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      passThrough.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      passThrough.on('error', (err: Error) => {
        reject(err);
      });

      // Create archiver instance with compression
      const archive = archiver.create('zip', {
        zlib: { level: options.compressionLevel ?? 6 },
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.on('warning', (err: archiver.ArchiverError) => {
        if (err.code === 'ENOENT') {
          console.warn('[ZipGenerator] Warning:', err.message);
        } else {
          reject(err);
        }
      });

      // Pipe archive to passthrough stream
      archive.pipe(passThrough);

      // Add each file to the archive
      for (const file of files) {
        archive.append(file.buffer, { name: file.name });
      }

      // Add manifest if requested
      if (options.includeManifest && options.manifestData) {
        const manifest = {
          generatedAt: new Date().toISOString(),
          totalFiles: files.length,
          files: options.manifestData,
        };
        archive.append(JSON.stringify(manifest, null, 2), {
          name: 'manifest.json',
        });
      }

      // Finalize the archive
      archive.finalize();
    });
  }

  /**
   * Generate a timestamped filename for the ZIP
   * @param prefix Prefix for the filename
   * @returns Formatted filename with timestamp
   */
  static generateZipFilename(prefix: string = 'invoices'): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    return `${prefix}_${timestamp}.zip`;
  }
}
