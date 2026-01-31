import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InvoiceEntity } from '../../../invoice/infrastructure/transaction/invoice.entity';
import { CompanyEntity } from '../../../company/infrastructure/persistence/company.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';
import { InvoiceReportRequestDto } from '../dto/invoice-report-request.dto';
import { InvoiceReportItemDto, InvoiceReportMetaDto, InvoiceReportResponseDto } from '../dto/invoice-report-response.dto';

@Injectable()
export class InvoiceReportQueryService {
  constructor(
    @InjectRepository(InvoiceEntity, 'transaction')
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(CompanyEntity, 'master')
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfRepository: Repository<HcfEntity>,
  ) {}

  /**
   * Normalizes filter DTO - maps legacy fields and ensures consistent field names
   */
  private normalizeFilters(filters: InvoiceReportRequestDto): InvoiceReportRequestDto {
    const normalized = { ...filters };
    
    // Map legacy fields to new fields
    if (normalized.fromDate && !normalized.invoiceFromDate) {
      normalized.invoiceFromDate = normalized.fromDate;
    }
    if (normalized.toDate && !normalized.invoiceToDate) {
      normalized.invoiceToDate = normalized.toDate;
    }
    if (normalized.search && !normalized.searchText) {
      normalized.searchText = normalized.search;
    }
    if (normalized.sortDir && !normalized.sortOrder) {
      normalized.sortOrder = normalized.sortDir;
    }
    
    return normalized;
  }

  /**
   * Validates that at least one filter condition is provided to prevent full table scans
   */
  private validateFilters(filters: InvoiceReportRequestDto): void {
    const hasDateRange = !!(filters.invoiceFromDate || filters.invoiceToDate);
    const hasSearch = !!filters.searchText?.trim();
    const hasCompanyFilter = !!filters.companyId;
    const hasHcfFilter = !!filters.hcfId;
    const hasStatusFilter = filters.status && filters.status !== 'All';
    const hasBillingTypeFilter = filters.billingType && filters.billingType !== 'All';

    if (!hasDateRange && !hasSearch && !hasCompanyFilter && !hasHcfFilter && !hasStatusFilter && !hasBillingTypeFilter) {
      // Apply default date range: last 90 days
      const defaultToDate = new Date();
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 90);
      
      filters.invoiceFromDate = defaultFromDate.toISOString().split('T')[0];
      filters.invoiceToDate = defaultToDate.toISOString().split('T')[0];
    }
  }

  /**
   * Searches companies and HCFs in master DB and returns matching IDs
   * Used to filter invoices by company/HCF names when searchText is provided
   */
  private async findMatchingCompanyAndHcfIds(searchText: string): Promise<{
    companyIds: string[];
    hcfIds: string[];
  }> {
    const searchTerm = `%${searchText.trim()}%`;
    
    const [matchingCompanies, matchingHcfs] = await Promise.all([
      this.companyRepository
        .createQueryBuilder('company')
        .where('company.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere(
          '(company.companyName ILIKE :searchTerm OR company.companyCode ILIKE :searchTerm)',
          { searchTerm },
        )
        .select('company.companyId', 'companyId')
        .getRawMany(),
      this.hcfRepository
        .createQueryBuilder('hcf')
        .where('hcf.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere(
          '(hcf.hcfName ILIKE :searchTerm OR hcf.hcfCode ILIKE :searchTerm)',
          { searchTerm },
        )
        .select('hcf.hcfId', 'hcfId')
        .getRawMany(),
    ]);

    return {
      companyIds: matchingCompanies.map((c) => c.companyId),
      hcfIds: matchingHcfs.map((h) => h.hcfId),
    };
  }

  /**
   * Builds WHERE conditions dynamically using TypeORM QueryBuilder
   * Only adds conditions when filter values are present
   */
  private buildWhereConditions(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    filters: InvoiceReportRequestDto,
    matchingCompanyIds?: string[],
    matchingHcfIds?: string[],
  ): void {
    // Always exclude deleted invoices
    queryBuilder.where('invoice.isDeleted = :isDeleted', { isDeleted: false });

    // Date range filters - use new field names
    if (filters.invoiceFromDate) {
      queryBuilder.andWhere('invoice.invoiceDate >= :invoiceFromDate', {
        invoiceFromDate: filters.invoiceFromDate,
      });
    }

    if (filters.invoiceToDate) {
      queryBuilder.andWhere('invoice.invoiceDate <= :invoiceToDate', {
        invoiceToDate: filters.invoiceToDate,
      });
    }

    // Company filter
    if (filters.companyId) {
      queryBuilder.andWhere('invoice.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    // HCF filter
    if (filters.hcfId) {
      queryBuilder.andWhere('invoice.hcfId = :hcfId', {
        hcfId: filters.hcfId,
      });
    }

    // Status filter - only apply if not 'All'
    if (filters.status && filters.status !== 'All') {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status,
      });
    }

    // Billing type filter - only apply if not 'All'
    if (filters.billingType && filters.billingType !== 'All') {
      queryBuilder.andWhere('invoice.billingType = :billingType', {
        billingType: filters.billingType,
      });
    }

    // Search filter - applies to InvoiceNo, Status, InvoiceValue, Company IDs, HCF IDs
    // Company/HCF name search is done by first finding matching IDs, then filtering invoices
    if (filters.searchText?.trim()) {
      const searchTerm = `%${filters.searchText.trim()}%`;
      const searchConditions: string[] = [
        'invoice.invoiceNumber ILIKE :searchText',
        'invoice.status::text ILIKE :searchText',
        'CAST(invoice.invoiceValue AS TEXT) ILIKE :searchText',
      ];

      // Add company ID filter if matching companies were found
      if (matchingCompanyIds && matchingCompanyIds.length > 0) {
        searchConditions.push('invoice.companyId IN (:...matchingCompanyIds)');
      }

      // Add HCF ID filter if matching HCFs were found
      if (matchingHcfIds && matchingHcfIds.length > 0) {
        searchConditions.push('invoice.hcfId IN (:...matchingHcfIds)');
      }

      // Build parameters object
      const searchParams: any = {
        searchText: searchTerm,
      };
      if (matchingCompanyIds && matchingCompanyIds.length > 0) {
        searchParams.matchingCompanyIds = matchingCompanyIds;
      }
      if (matchingHcfIds && matchingHcfIds.length > 0) {
        searchParams.matchingHcfIds = matchingHcfIds;
      }

      // Combine all search conditions with OR
      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
    }
  }

  /**
   * Applies search filter to company/HCF names after fetching master data
   */
  private applySearchFilter(
    data: InvoiceReportItemDto[],
    searchTerm: string,
  ): InvoiceReportItemDto[] {
    if (!searchTerm?.trim()) {
      return data;
    }

    const lowerSearch = searchTerm.toLowerCase().trim();
    return data.filter(
      (item) =>
        item.companyName.toLowerCase().includes(lowerSearch) ||
        item.hcfName.toLowerCase().includes(lowerSearch) ||
        item.hcfCode.toLowerCase().includes(lowerSearch),
    );
  }

  /**
   * Builds the ORDER BY clause dynamically
   */
  private buildOrderBy(
    queryBuilder: SelectQueryBuilder<InvoiceEntity>,
    filters: InvoiceReportRequestDto,
  ): void {
    const sortBy = filters.sortBy || 'invoiceDate';
    const sortOrder = filters.sortOrder || 'DESC';

    // Map sortBy to actual column names
    const sortColumnMap: Record<string, string> = {
      invoiceDate: 'invoice.invoiceDate',
      invoiceNumber: 'invoice.invoiceNumber',
      invoiceValue: 'invoice.invoiceValue',
      createdOn: 'invoice.createdOn',
    };

    const sortColumn = sortColumnMap[sortBy] || 'invoice.invoiceDate';
    queryBuilder.orderBy(sortColumn, sortOrder);
  }

  /**
   * Main query method - executes optimized query with dynamic filters
   * Reusable for: Table load, Apply Filters, Pagination, Export
   */
  async getInvoiceReport(
    filters: InvoiceReportRequestDto,
  ): Promise<InvoiceReportResponseDto> {
    // Normalize filters (handle legacy field names)
    const normalizedFilters = this.normalizeFilters(filters);
    
    // Validate filters to prevent full table scans
    this.validateFilters(normalizedFilters);

    const page = normalizedFilters.page || 1;
    const pageSize = normalizedFilters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // If searchText is provided, first find matching company and HCF IDs
    let matchingCompanyIds: string[] | undefined;
    let matchingHcfIds: string[] | undefined;
    if (normalizedFilters.searchText?.trim()) {
      const matchingIds = await this.findMatchingCompanyAndHcfIds(
        normalizedFilters.searchText,
      );
      matchingCompanyIds = matchingIds.companyIds;
      matchingHcfIds = matchingIds.hcfIds;
    }

    // Build invoice query (transaction DB)
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice');

    // Apply dynamic WHERE conditions (only when filter values are present)
    // Pass matching company/HCF IDs for search filtering
    this.buildWhereConditions(
      queryBuilder,
      normalizedFilters,
      matchingCompanyIds,
      matchingHcfIds,
    );

    // Get total count before pagination
    const totalRecords = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(pageSize);

    // Apply dynamic sorting
    this.buildOrderBy(queryBuilder, normalizedFilters);

    // Execute invoice query
    const invoices = await queryBuilder.getMany();

    // Fetch company and HCF data from master DB (batch fetch for performance)
    const companyIds = [...new Set(invoices.map((inv) => inv.companyId))];
    const hcfIds = [...new Set(invoices.map((inv) => inv.hcfId))];

    const [companies, hcfs] = await Promise.all([
      companyIds.length > 0
        ? this.companyRepository.find({
            where: companyIds.map((id) => ({ companyId: id, isDeleted: false })),
          })
        : [],
      hcfIds.length > 0
        ? this.hcfRepository.find({
            where: hcfIds.map((id) => ({ hcfId: id, isDeleted: false })),
          })
        : [],
    ]);

    // Create lookup maps
    const companyMap = new Map(companies.map((c) => [c.companyId, c]));
    const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));

    // Map results to DTO
    let data: InvoiceReportItemDto[] = invoices.map((invoice) => {
      const company = companyMap.get(invoice.companyId);
      const hcf = hcfMap.get(invoice.hcfId);

      return {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate
          ? new Date(invoice.invoiceDate).toISOString().split('T')[0]
          : '',
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().split('T')[0]
          : '',
        billingType: invoice.billingType,
        invoiceValue: Number(invoice.invoiceValue || 0),
        totalPaidAmount: Number(invoice.totalPaidAmount || 0),
        balanceAmount: Number(invoice.balanceAmount || 0),
        status: invoice.status,
        companyId: invoice.companyId,
        companyName: company?.companyName || 'N/A',
        companyCode: company?.companyCode || 'N/A',
        hcfId: invoice.hcfId,
        hcfName: hcf?.hcfName || 'N/A',
        hcfCode: hcf?.hcfCode || 'N/A',
      };
    });

    // Search filtering is now done at the database level via company/HCF IDs
    // No need for client-side filtering anymore - pagination is accurate
    const filteredData = data;

    // Determine state
    const hasFilters =
      !!(normalizedFilters.invoiceFromDate || normalizedFilters.invoiceToDate || 
         normalizedFilters.companyId || normalizedFilters.hcfId ||
         (normalizedFilters.status && normalizedFilters.status !== 'All') ||
         (normalizedFilters.billingType && normalizedFilters.billingType !== 'All') ||
         normalizedFilters.searchText?.trim());

    let state: 'NO_FILTER' | 'NO_RESULTS' | 'HAS_RESULTS';
    if (!hasFilters) {
      state = 'NO_FILTER';
    } else if (totalRecords === 0 || filteredData.length === 0) {
      state = 'NO_RESULTS';
    } else {
      state = 'HAS_RESULTS';
    }

    // Build meta
    const meta: InvoiceReportMetaDto = {
      page,
      pageSize,
      totalRecords: filteredData.length < data.length ? filteredData.length : totalRecords,
      totalPages: Math.ceil((filteredData.length < data.length ? filteredData.length : totalRecords) / pageSize),
      state,
    };

    return {
      data: filteredData,
      meta,
    };
  }
}
