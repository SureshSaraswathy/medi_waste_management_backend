import { Injectable, BadRequestException } from '@nestjs/common';
import { ExportModule } from '../dto/export-request.dto';
import { IExportDataProvider } from '../../domain/interfaces/export-data-provider.interface';

/**
 * Registry for module-specific data providers
 * Modules register their data providers here
 */
@Injectable()
export class ExportDataProviderRegistry {
  private providers: Map<ExportModule, IExportDataProvider> = new Map();

  /**
   * Register a data provider for a module
   */
  register(module: ExportModule, provider: IExportDataProvider): void {
    this.providers.set(module, provider);
  }

  /**
   * Get data provider for a module
   */
  getProvider(module: ExportModule): IExportDataProvider {
    const provider = this.providers.get(module);
    if (!provider) {
      throw new BadRequestException(`No export data provider registered for module: ${module}`);
    }
    return provider;
  }

  /**
   * Check if a provider exists for a module
   */
  hasProvider(module: ExportModule): boolean {
    return this.providers.has(module);
  }

  /**
   * Get all registered modules
   */
  getRegisteredModules(): ExportModule[] {
    return Array.from(this.providers.keys());
  }
}
