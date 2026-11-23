import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { isDesignatedSuperAdmin, SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { ConfigService } from '@nestjs/config';
import { MAX_LOGO_BYTES } from '../../common/storage/image-validator.util';
import { BrandingService } from './branding.service';

@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService, private readonly configService: ConfigService) {}

  /**
   * Does the caller hold the designated SuperAdmin identity? The UI shows the Application Branding button only when this
   * answers true. It applies the same rule as the guard on the write endpoints, which stay authoritative.
   */
  @Get('access')
  @UseGuards(JwtAuthGuard)
  access(@Request() req: any) {
    return { success: true, data: { canManageBranding: isDesignatedSuperAdmin(req.user, this.configService.get('app')?.superAdmin || {}) } };
  }

  /** PUBLIC: needed by the login page and the loading screen (no token yet). */
  @Get('app-logo/meta')
  async meta() {
    const info = await this.brandingService.getAppLogo();
    return {
      success: true,
      data: {
        hasLogo: !!info,
        version: info ? new Date(info.updatedAt).getTime() : 0,
        url: info ? `/branding/app-logo?v=${new Date(info.updatedAt).getTime()}` : null,
      },
    };
  }

  /** PUBLIC: streams the application logo, 404 when none is configured. */
  @Get('app-logo')
  async getLogo(@Res() res: Response) {
    const file = await this.brandingService.getAppLogoFile();
    if (!file) throw new NotFoundException('Application logo not configured');
    res.set({
      'Content-Type': file.mime,
      'Content-Length': String(file.buffer.length),
      // The URL carries ?v=<version>, so a replaced logo is fetched fresh.
      'Cache-Control': 'public, max-age=3600',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.end(file.buffer);
  }

  /** SuperAdmin only. */
  @Post('app-logo')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_LOGO_BYTES, files: 1 } }))
  async upload(@UploadedFile() file: any, @Request() req: any) {
    if (!file) throw new BadRequestException('No file uploaded. Send the image in the "file" field.');
    const info = await this.brandingService.saveAppLogo(file, req.user?.userId);
    const v = new Date(info.updatedAt).getTime();
    return {
      success: true,
      data: { hasLogo: true, version: v, url: `/branding/app-logo?v=${v}` },
      message: 'Application logo saved successfully',
    };
  }

  /** SuperAdmin only. */
  @Delete('app-logo')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async remove() {
    await this.brandingService.removeAppLogo();
    return { success: true, data: { hasLogo: false, version: 0, url: null }, message: 'Application logo removed' };
  }
}
