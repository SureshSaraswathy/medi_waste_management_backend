import { Module } from '@nestjs/common';
import { ExportController } from './presentation/export.controller';
import { ExportService } from './application/services/export.service';
import { ExportValidator } from './application/validators/export.validator';
import { PdfGenerator } from './infrastructure/generators/pdf.generator';
import { ExcelGenerator } from './infrastructure/generators/excel.generator';
import { ExportAuditService } from './application/services/export-audit.service';
import { ExportDataProviderRegistry } from './application/services/export-data-provider-registry.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [ExportController],
  providers: [
    ExportService,
    ExportValidator,
    PdfGenerator,
    ExcelGenerator,
    ExportAuditService,
    ExportDataProviderRegistry,
  ],
  exports: [
    ExportService,
    ExportDataProviderRegistry,
    ExportValidator,
  ],
})
export class ExportModule {}
