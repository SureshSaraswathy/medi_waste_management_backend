import { BadRequestException } from '@nestjs/common';
import DOMPurify from 'isomorphic-dompurify';

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_LOGO_DIMENSION = 4000; // px (PNG / JPG)

export interface ValidatedImage {
  buffer: Buffer;
  mime: 'image/png' | 'image/jpeg' | 'image/svg+xml';
  ext: 'png' | 'jpg' | 'svg';
}

const ALLOWED_EXT: Record<string, ValidatedImage['mime']> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
};

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function detectKind(buf: Buffer): 'png' | 'jpg' | 'svg' | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIG)) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // SVG is text: look for an <svg root element near the start
  const head = buf.subarray(0, Math.min(buf.length, 2048)).toString('utf8').toLowerCase();
  if (head.includes('<svg')) return 'svg';
  return null;
}

function pngDimensions(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 24) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function jpgDimensions(buf: Buffer): { w: number; h: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

/**
 * Cheap integrity check for a file read back from disk: its content must still look like the image type it was stored
 * as. A corrupt or replaced file is then treated as "no logo" (404 / document fallback) instead of being sent to
 * browsers and PDF engines.
 */
export function looksLikeImage(buffer: Buffer | undefined | null, mime: string | undefined | null): boolean {
  if (!buffer || buffer.length === 0) return false;
  const kind = detectKind(buffer);
  if (mime === 'image/png') return kind === 'png';
  if (mime === 'image/jpeg') return kind === 'jpg';
  if (mime === 'image/svg+xml') return kind === 'svg';
  return false;
}

/** Sanitise an SVG: strips scripts, event handlers, foreignObject, external refs, etc. */
export function sanitizeSvg(raw: string): string {
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'use', 'image', 'a', 'style'],
    FORBID_ATTR: ['href', 'xlink:href', 'style'],
    WHOLE_DOCUMENT: false,
  });
  return String(clean).trim();
}

/**
 * Validates an uploaded logo.
 * Extension, declared MIME and magic bytes must all agree. SVG content is sanitised.
 */
export function validateAndPrepareLogo(file: {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
}): ValidatedImage {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestException('No file uploaded. Send the image in the "file" field.');
  }
  if (file.buffer.length > MAX_LOGO_BYTES) {
    throw new BadRequestException('Logo must be 2 MB or smaller.');
  }

  const name = String(file.originalname || '');
  const dot = name.lastIndexOf('.');
  const extFromName = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
  const expectedMime = ALLOWED_EXT[extFromName];
  if (!expectedMime) {
    throw new BadRequestException('Unsupported file type. Allowed: PNG, JPG, SVG.');
  }
  if ((file.mimetype || '').toLowerCase() !== expectedMime) {
    throw new BadRequestException('File type does not match its extension.');
  }

  const kind = detectKind(file.buffer);
  const expectedKind = expectedMime === 'image/png' ? 'png' : expectedMime === 'image/jpeg' ? 'jpg' : 'svg';
  if (kind !== expectedKind) {
    throw new BadRequestException('File content is not a valid image of the declared type.');
  }

  if (kind === 'png' || kind === 'jpg') {
    const dim = kind === 'png' ? pngDimensions(file.buffer) : jpgDimensions(file.buffer);
    if (!dim || dim.w <= 0 || dim.h <= 0) {
      throw new BadRequestException('Could not read image dimensions. The file may be corrupt.');
    }
    if (dim.w > MAX_LOGO_DIMENSION || dim.h > MAX_LOGO_DIMENSION) {
      throw new BadRequestException(`Image dimensions must not exceed ${MAX_LOGO_DIMENSION}x${MAX_LOGO_DIMENSION}px.`);
    }
    return { buffer: file.buffer, mime: expectedMime, ext: kind };
  }

  // SVG
  const sanitized = sanitizeSvg(file.buffer.toString('utf8'));
  if (!sanitized.toLowerCase().startsWith('<svg')) {
    throw new BadRequestException('SVG could not be validated.');
  }
  return { buffer: Buffer.from(sanitized, 'utf8'), mime: 'image/svg+xml', ext: 'svg' };
}
