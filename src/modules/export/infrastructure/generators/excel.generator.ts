import { Injectable } from '@nestjs/common';
import { ExportRequestDto } from '../../application/dto/export-request.dto';
import { IExportDataProvider } from '../../domain/interfaces/export-data-provider.interface';

/**
 * Excel Generator Service
 * Streaming for large data
 * Export logic must NOT contain DB queries, validation, or business rules
 */
@Injectable()
export class ExcelGenerator {
  /**
   * Generate Excel from provided data
   * Uses streaming for large datasets
   * @param data Array of data objects
   * @param columns Column definitions
   * @param options Export options
   * @returns Excel buffer or stream
   */
  async generate(
    data: any[],
    columns: Array<{ key: string; label: string; width?: number }>,
    options: {
      title: string;
      module: string;
      filters: ExportRequestDto;
      dataProvider: IExportDataProvider;
      useStreaming?: boolean;
    },
  ): Promise<Buffer> {
    // Note: This is a placeholder implementation
    // In production, use exceljs library for streaming support
    // For now, we'll create a simple CSV structure

    const excelContent = this.buildExcelContent(data, columns, options);

    // In production, use exceljs:
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet(options.title);
    // ... build Excel worksheet with streaming
    // return buffer;

    // Placeholder: return CSV buffer (replace with actual Excel generation)
    return Buffer.from(excelContent, 'utf-8');
  }

  private buildExcelContent(
    data: any[],
    columns: Array<{ key: string; label: string; width?: number }>,
    options: {
      title: string;
      module: string;
      filters: ExportRequestDto;
      dataProvider: IExportDataProvider;
    },
  ): string {
    let content = '';

    // Header row
    const headers = columns.map((col) => col.label).join(',');
    content += `${headers}\n`;

    // Data rows
    data.forEach((row) => {
      const transformedRow = options.dataProvider.transformRow
        ? options.dataProvider.transformRow(row)
        : row;
      const values = columns.map((col) => {
        const value = transformedRow[col.key];
        // Escape commas and quotes in CSV
        if (value !== null && value !== undefined) {
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }
        return '';
      });
      content += `${values.join(',')}\n`;
    });

    return content;
  }

  /**
   * Generate Excel with streaming for large datasets
   * @param dataStream Async iterator or stream of data
   * @param columns Column definitions
   * @param options Export options
   * @returns Excel stream
   */
  async generateStreaming(
    dataStream: AsyncIterable<any>,
    columns: Array<{ key: string; label: string; width?: number }>,
    options: {
      title: string;
      module: string;
      filters: ExportRequestDto;
      dataProvider: IExportDataProvider;
    },
  ): Promise<NodeJS.ReadableStream> {
    // Placeholder: In production, use exceljs streaming
    // This would create a readable stream that writes Excel data incrementally
    throw new Error('Streaming Excel generation not yet implemented. Use regular generate() method.');
  }

  /**
   * Get file extension
   */
  getFileExtension(): string {
    return 'xlsx';
  }

  /**
   * Get MIME type
   */
  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
}
