import { promises as fs } from 'fs';
import { inflateRawSync } from 'zlib';

export interface ZipManifest {
  generatedAt?: string;
  totalFiles?: number;
  files?: Array<{ fileName?: string; invoiceId?: string; invoiceNumber?: string }>;
}

const MAX_MANIFEST_BYTES = 5 * 1024 * 1024;

/**
 * Reads `manifest.json` out of a ZIP produced by ZipGenerator WITHOUT extracting or loading the whole archive
 * (only the end-of-central-directory record, the central directory and the one entry are read). No dependency.
 * Returns null for anything unexpected (missing file, not a zip, no manifest, ZIP64, too large, unreadable JSON):
 * callers must treat null as "cannot be established", never as "allowed".
 */
export async function readZipManifest(filePath: string): Promise<ZipManifest | null> {
  let fh: fs.FileHandle | null = null;
  try {
    fh = await fs.open(filePath, 'r');
    const { size } = await fh.stat();
    if (size < 22) return null;
    const tailLen = Math.min(size, 22 + 65535);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    if (cdSize === 0xffffffff || cdOffset === 0xffffffff) return null; // ZIP64: not produced by our generator
    if (cdOffset + cdSize > size || cdSize > 16 * 1024 * 1024) return null;
    const cd = Buffer.alloc(cdSize);
    await fh.read(cd, 0, cdSize, cdOffset);
    let p = 0;
    while (p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50) {
      const method = cd.readUInt16LE(p + 10);
      const compSize = cd.readUInt32LE(p + 20);
      const rawSize = cd.readUInt32LE(p + 24);
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const commentLen = cd.readUInt16LE(p + 32);
      const localOffset = cd.readUInt32LE(p + 42);
      const name = cd.toString('utf8', p + 46, p + 46 + nameLen);
      if (name === 'manifest.json') {
        if (rawSize > MAX_MANIFEST_BYTES || compSize > MAX_MANIFEST_BYTES || localOffset + 30 > size) return null;
        const lh = Buffer.alloc(30);
        await fh.read(lh, 0, 30, localOffset);
        if (lh.readUInt32LE(0) !== 0x04034b50) return null;
        const dataStart = localOffset + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
        if (dataStart + compSize > size) return null;
        const data = Buffer.alloc(compSize);
        await fh.read(data, 0, compSize, dataStart);
        const raw = method === 0 ? data : method === 8 ? inflateRawSync(data) : null;
        if (!raw) return null;
        const parsed = JSON.parse(raw.toString('utf8'));
        return parsed && typeof parsed === 'object' ? (parsed as ZipManifest) : null;
      }
      p += 46 + nameLen + extraLen + commentLen;
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => undefined);
  }
}
