import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMPANY_REPOSITORY_TOKEN,
  CompanyLogoInfo,
  ICompanyRepository,
} from '../../domain/interfaces/company.repository.interface';
import { FileStorageService } from '../../../../common/storage/file-storage.service';
import { looksLikeImage, validateAndPrepareLogo } from '../../../../common/storage/image-validator.util';

/**
 * Company Logo use-cases (upload / replace / remove / read).
 * Each company owns its own logo; nothing here is shared with the Application Logo.
 */
@Injectable()
export class CompanyLogoService {
  constructor(
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    private readonly storage: FileStorageService,
  ) {}

  /** API-relative URL (the frontend prefixes its configured API base URL). */
  buildUrl(companyId: string, info?: CompanyLogoInfo | null): string | null {
    if (!info?.logoPath) return null;
    const v = info.logoUpdatedAt ? new Date(info.logoUpdatedAt).getTime() : 0;
    return `/companies/${companyId}/logo?v=${v}`;
  }

  private async assertCompany(companyId: string) {
    const entity = await this.companyRepository.getEntityById(companyId);
    if (!entity) throw new NotFoundException('Company not found');
  }

  async upload(companyId: string, file: any): Promise<CompanyLogoInfo | null> {
    await this.assertCompany(companyId);
    const image = validateAndPrepareLogo(file);
    this.dataUriCache.delete(companyId);

    const previous = await this.companyRepository.getLogoInfo(companyId);
    const newPath = await this.storage.saveLogo(`companies/${companyId}`, 'logo', image.ext, image.buffer);

    try {
      await this.companyRepository.setLogo(companyId, newPath, image.mime);
    } catch (err) {
      // DB write failed (e.g. migration not applied): don't leave an orphan file behind
      await this.storage.deleteFile(newPath);
      throw err;
    }

    // Remove only the previous logo of this same company, after the DB points to the new one
    if (previous?.logoPath && previous.logoPath !== newPath) {
      await this.storage.deleteFile(previous.logoPath);
    }
    return this.companyRepository.getLogoInfo(companyId);
  }

  async remove(companyId: string): Promise<void> {
    await this.assertCompany(companyId);
    this.dataUriCache.delete(companyId);
    const previous = await this.companyRepository.getLogoInfo(companyId);
    if (!previous) return;
    await this.companyRepository.clearLogo(companyId);
    await this.storage.deleteFile(previous.logoPath);
  }

  private readonly dataUriCache = new Map<string, { value: string | undefined; at: number }>();
  private static readonly DATA_URI_TTL_MS = 60_000;

  /**
   * Logo as a base64 data-URI for server-rendered documents (invoice PDFs, etc.).
   * Embedding avoids auth/CORS/network problems inside the headless browser.
   * Returns undefined when the company has no logo or it cannot be read, so callers
   * keep their existing fallback and document generation never fails because of a logo.
   */
  async getLogoDataUri(companyId?: string | null): Promise<string | undefined> {
    if (!companyId) return undefined;
    const hit = this.dataUriCache.get(companyId);
    if (hit && Date.now() - hit.at < CompanyLogoService.DATA_URI_TTL_MS) return hit.value;

    let value: string | undefined;
    try {
      const file = await this.getFile(companyId);
      if (file) value = `data:${file.mime};base64,${file.buffer.toString('base64')}`;
    } catch {
      // A lookup error (database hiccup, ...) is NOT cached: this document goes out without a logo, the next one retries.
      return undefined;
    }
    this.dataUriCache.set(companyId, { value, at: Date.now() });
    return value;
  }

  async getFile(companyId: string): Promise<{ buffer: Buffer; mime: string } | null> {
    const info = await this.companyRepository.getLogoInfo(companyId);
    if (!info) return null;
    try {
      const buffer = await this.storage.read(info.logoPath);
      return looksLikeImage(buffer, info.logoMime) ? { buffer, mime: info.logoMime } : null; // corrupt file = no logo
    } catch {
      return null;
    }
  }
}
