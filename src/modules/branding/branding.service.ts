import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FileStorageService } from '../../common/storage/file-storage.service';
import { looksLikeImage, validateAndPrepareLogo } from '../../common/storage/image-validator.util';

const APP_LOGO_KEY = 'application_logo';

export interface AppLogoInfo {
  path: string;
  mime: string;
  updatedAt: string;
}

/**
 * Application Branding (Application Logo).
 * Stored in the generic `app_settings` table - intentionally NOT linked to any company.
 * All reads are defensive so the login page keeps working before the migration is applied.
 */
@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);

  constructor(
    @InjectDataSource('master') private readonly dataSource: DataSource,
    private readonly storage: FileStorageService,
  ) {}

  async getAppLogo(): Promise<AppLogoInfo | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT setting_value FROM app_settings WHERE setting_key = $1`,
        [APP_LOGO_KEY],
      );
      const v = rows?.[0]?.setting_value;
      if (!v || !v.path) return null;
      return v as AppLogoInfo;
    } catch (err: any) {
      this.logger.warn(`app_settings not available yet: ${err?.message}`);
      return null;
    }
  }

  async getAppLogoFile(): Promise<{ buffer: Buffer; mime: string } | null> {
    const info = await this.getAppLogo();
    if (!info) return null;
    try {
      const buffer = await this.storage.read(info.path);
      return looksLikeImage(buffer, info.mime) ? { buffer, mime: info.mime } : null; // corrupt file = no logo
    } catch {
      return null;
    }
  }

  async saveAppLogo(file: any, userId?: string): Promise<AppLogoInfo> {
    const image = validateAndPrepareLogo(file);
    const previous = await this.getAppLogo();
    const newPath = await this.storage.saveLogo('branding', 'app-logo', image.ext, image.buffer);
    const value: AppLogoInfo = { path: newPath, mime: image.mime, updatedAt: new Date().toISOString() };

    try {
      await this.dataSource.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at, updated_by)
         VALUES ($1, $2::jsonb, NOW(), $3)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [APP_LOGO_KEY, JSON.stringify(value), this.asUuid(userId)],
      );
    } catch (err) {
      await this.storage.deleteFile(newPath); // no orphan file if the DB write fails
      throw err;
    }

    if (previous?.path && previous.path !== newPath) {
      await this.storage.deleteFile(previous.path);
    }
    return value;
  }

  async removeAppLogo(): Promise<void> {
    const previous = await this.getAppLogo();
    if (!previous) return;
    await this.dataSource.query(`DELETE FROM app_settings WHERE setting_key = $1`, [APP_LOGO_KEY]);
    await this.storage.deleteFile(previous.path);
  }

  private asUuid(v?: string): string | null {
    return v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;
  }
}
