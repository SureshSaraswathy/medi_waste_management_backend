import { ExportRequestDto } from '../../application/dto/export-request.dto';

/**
 * Interface for module-specific data providers
 * Export logic must NOT contain DB queries - data is provided by modules
 */
export interface IExportDataProvider {
  /**
   * Get data for export based on filters
   * This method should use the module's existing repository/use cases
   * @param filters Export filters
   * @returns Array of data objects to export
   */
  getDataForExport(filters: ExportRequestDto): Promise<any[]>;

  /**
   * Get estimated record count (for async export decision)
   * Should be fast - can use COUNT query
   */
  getEstimatedRecordCount(filters: ExportRequestDto): Promise<number>;

  /**
   * Get column definitions for export
   * @returns Array of column definitions { key, label, width? }
   */
  getColumnDefinitions(): Array<{ key: string; label: string; width?: number }>;

  /**
   * Transform data row for export (optional formatting)
   */
  transformRow?(row: any): any;
}
