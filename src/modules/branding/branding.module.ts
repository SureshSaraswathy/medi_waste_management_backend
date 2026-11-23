import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../common/storage/storage.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';

/**
 * Application Branding: a small API surface (no navigation / screens of its own).
 * The UI lives inside the existing Company Master screen.
 */
@Module({
  imports: [AuthModule, StorageModule],
  controllers: [BrandingController],
  providers: [BrandingService],
})
export class BrandingModule {}
