import { Injectable, Inject } from '@nestjs/common';
import { ExportRequestDto } from '../../../export/application/dto/export-request.dto';
import { IExportDataProvider } from '../../../export/domain/interfaces/export-data-provider.interface';
import { IHcfAmendmentRepository, HCF_AMENDMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/hcf-amendment.repository.interface';
import { HcfAmendment } from '../../domain/entities/hcf-amendment.domain.entity';

/**
 * HCF Amendment Export Data Provider
 * Provides data for HCF Amendment exports (PDF/Excel)
 */
@Injectable()
export class HcfAmendmentExportProvider implements IExportDataProvider {
  constructor(
    @Inject(HCF_AMENDMENT_REPOSITORY_TOKEN)
    private readonly hcfAmendmentRepository: IHcfAmendmentRepository,
  ) {}

  /**
   * Get HCF Amendment data for export based on filters
   */
  async getDataForExport(filters: ExportRequestDto): Promise<any[]> {
    let amendments: HcfAmendment[] = [];

    // Get amendments based on HCF ID filter
    if (filters.hcfId) {
      amendments = await this.hcfAmendmentRepository.findByHcf(filters.hcfId);
    } else {
      // Get all amendments
      amendments = await this.hcfAmendmentRepository.findAll();
    }

    // Apply status filter
    if (filters.status) {
      amendments = amendments.filter(a => a.amendmentStatus === filters.status);
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      amendments = amendments.filter(a => {
        const amendmentDate = new Date(a.amendmentDate);
        if (filters.dateFrom && amendmentDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo) {
          const dateTo = new Date(filters.dateTo);
          dateTo.setHours(23, 59, 59, 999); // Include entire end date
          if (amendmentDate > dateTo) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      amendments = amendments.filter(a => 
        a.amendmentType?.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower) ||
        a.hcfId?.toLowerCase().includes(searchLower)
      );
    }

    return amendments;
  }

  /**
   * Get estimated record count for export
   */
  async getEstimatedRecordCount(filters: ExportRequestDto): Promise<number> {
    const data = await this.getDataForExport(filters);
    return data.length;
  }

  /**
   * Get column definitions for HCF Amendment export
   */
  getColumnDefinitions(): Array<{ key: string; label: string; width?: number }> {
    return [
      { key: 'hcfAmendmentId', label: 'Amendment ID', width: 120 },
      { key: 'hcfId', label: 'HCF ID', width: 120 },
      { key: 'amendmentType', label: 'Amendment Type', width: 150 },
      { key: 'amendmentDate', label: 'Amendment Date', width: 120 },
      { key: 'description', label: 'Description', width: 200 },
      { key: 'amendmentStatus', label: 'Status', width: 100 },
      { key: 'approvedBy', label: 'Approved By', width: 120 },
      { key: 'approvedDate', label: 'Approved Date', width: 120 },
      { key: 'createdBy', label: 'Created By', width: 120 },
      { key: 'createdOn', label: 'Created On', width: 120 },
      { key: 'modifiedBy', label: 'Modified By', width: 120 },
      { key: 'modifiedOn', label: 'Modified On', width: 120 },
    ];
  }

  /**
   * Transform row data for export formatting
   */
  transformRow(row: any): any {
    return {
      hcfAmendmentId: row.hcfAmendmentId || '',
      hcfId: row.hcfId || '',
      amendmentType: row.amendmentType || '',
      amendmentDate: row.amendmentDate ? new Date(row.amendmentDate).toLocaleDateString() : '',
      description: row.description || '',
      amendmentStatus: row.amendmentStatus || 'Pending',
      approvedBy: row.approvedBy || '',
      approvedDate: row.approvedDate ? new Date(row.approvedDate).toLocaleDateString() : '',
      createdBy: row.createdBy || '',
      createdOn: row.createdOn ? new Date(row.createdOn).toLocaleDateString() : '',
      modifiedBy: row.modifiedBy || '',
      modifiedOn: row.modifiedOn ? new Date(row.modifiedOn).toLocaleDateString() : '',
    };
  }
}
