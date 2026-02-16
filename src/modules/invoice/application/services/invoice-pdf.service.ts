import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import pLimit from 'p-limit';
import { InvoiceTemplateUtil, InvoiceTemplateData } from '../../../../common/utils/invoice-template.util';
import { PdfGeneratorUtil, PDFOptions } from '../../../../common/utils/pdf-generator.util';
import { ZipGenerator, ZipFileEntry, ZipManifestEntry } from '../../../../common/utils/zip-generator.util';
import { IInvoiceRepository, INVOICE_REPOSITORY_TOKEN } from '../../domain/interfaces/invoice.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { CompanyEntity } from '../../../company/infrastructure/persistence/company.entity';
import { HcfEntity } from '../../../hcf/infrastructure/persistence/hcf.entity';

/**
 * Invoice PDF Service
 * Generates PDF invoices from invoice data
 */
@Injectable()
export class InvoicePdfService implements OnModuleDestroy {
  private readonly logger = new Logger(InvoicePdfService.name);
  private readonly companyCache = new Map<string, { data: any; timestamp: number }>();
  private readonly hcfCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes (cache cleared on service restart)
  private readonly pdfLimit = pLimit(5); // Max 5 concurrent PDF generations

  constructor(
    @Inject(INVOICE_REPOSITORY_TOKEN)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
    @InjectRepository(CompanyEntity, 'master')
    private readonly companyEntityRepository: Repository<CompanyEntity>,
    @InjectRepository(HcfEntity, 'master')
    private readonly hcfEntityRepository: Repository<HcfEntity>,
  ) {}

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await PdfGeneratorUtil.closeBrowser();
  }

  /**
   * Generate PDF for a single invoice
   * @param invoiceId - Invoice ID
   * @param format - Response format: 'base64' for base64 string, undefined/other for Buffer
   */
  async generateInvoicePdf(invoiceId: string, format?: string): Promise<Buffer | string> {
    try {
      this.logger.debug(`Generating PDF for invoice: ${invoiceId}`);

      // Fetch invoice with all related data
      const invoice = await this.invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }

      // Fetch company and HCF details with caching
      const [company, hcf] = await Promise.all([
        this.getCompanyWithCache(invoice.companyId),
        this.getHcfWithCache(invoice.hcfId),
      ]);

      if (!company) {
        throw new Error(`Company not found: ${invoice.companyId}`);
      }

      if (!hcf) {
        throw new Error(`HCF not found: ${invoice.hcfId}`);
      }

      // Prepare template data with QR code
      const templateData = await this.prepareTemplateData(invoice, company, hcf);

      // Generate HTML
      const htmlContent = InvoiceTemplateUtil.generateInvoiceHTML(templateData);

      // Generate PDF from HTML with format support
      const pdfResult = await this.htmlToPdfBuffer(htmlContent, invoice.invoiceNumber, format);

      this.logger.debug(`PDF generated successfully for invoice: ${invoiceId}`);

      return pdfResult;
    } catch (error) {
      this.logger.error(`Error generating PDF for invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Generate PDFs for multiple invoices in bulk (optimized)
   * @param invoiceIds - Array of invoice IDs
   * @param format - Response format: 'base64' for base64 string, undefined/other for Buffer
   * @returns Array of PDF results
   */
  async generateBulkInvoicePdfs(
    invoiceIds: string[],
    format?: string,
  ): Promise<(Buffer | string)[]> {
    try {
      this.logger.debug(`Generating ${invoiceIds.length} PDFs in bulk`);
      const startTime = Date.now();

      // Batch fetch all invoices
      const invoices = await this.findByIds(invoiceIds);
      if (invoices.length === 0) {
        throw new Error('No invoices found');
      }

      // Extract unique company and HCF IDs
      const companyIds = [...new Set(invoices.map((inv) => inv.companyId))];
      const hcfIds = [...new Set(invoices.map((inv) => inv.hcfId))];

      this.logger.debug(
        `Batch fetching ${companyIds.length} companies and ${hcfIds.length} HCFs`,
      );

      // Batch fetch companies and HCFs
      const [companies, hcfs] = await Promise.all([
        this.findCompaniesByIds(companyIds),
        this.findHcfsByIds(hcfIds),
      ]);

      // Create lookup maps
      const companyMap = new Map(companies.map((c) => [c.companyId, c]));
      const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));

      // Generate PDFs with concurrency control
      const pdfResults = await Promise.all(
        invoices.map((invoice) =>
          this.pdfLimit(async () => {
            const company = companyMap.get(invoice.companyId);
            const hcf = hcfMap.get(invoice.hcfId);

            if (!company || !hcf) {
              throw new Error(
                `Missing data for invoice ${invoice.invoiceId}`,
              );
            }

            const templateData = await this.prepareTemplateData(
              invoice,
              company,
              hcf,
            );
            const htmlContent =
              InvoiceTemplateUtil.generateInvoiceHTML(templateData);
            return await this.htmlToPdfBuffer(
              htmlContent,
              invoice.invoiceNumber,
              format,
            );
          }),
        ),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Bulk PDF generation completed: ${invoiceIds.length} PDFs in ${duration}ms (${Math.round(duration / invoiceIds.length)}ms per PDF)`,
      );

      return pdfResults;
    } catch (error) {
      this.logger.error('Error generating bulk PDFs:', error);
      throw error;
    }
  }

  /**
   * Generate a ZIP file containing multiple invoice PDFs
   * @param invoiceIds - Array of invoice IDs
   * @param includeManifest - Whether to include a manifest.json in the ZIP
   * @returns ZIP file as Buffer
   */
  async generateBulkPdfZip(
    invoiceIds: string[],
    includeManifest: boolean = true,
  ): Promise<{ buffer: Buffer; filename: string }> {
    try {
      this.logger.debug(`Generating ZIP for ${invoiceIds.length} invoices`);
      const startTime = Date.now();

      // Batch fetch all invoices for metadata
      const invoices = await this.findByIds(invoiceIds);
      if (invoices.length === 0) {
        throw new Error('No invoices found');
      }

      // Create invoice lookup map for metadata
      const invoiceMap = new Map(invoices.map((inv) => [inv.invoiceId, inv]));

      // Get HCF names for manifest
      const hcfIds = [...new Set(invoices.map((inv) => inv.hcfId))];
      const hcfs = await this.findHcfsByIds(hcfIds);
      const hcfMap = new Map(hcfs.map((h) => [h.hcfId, h]));

      // Generate all PDFs as buffers
      const pdfBuffers = await this.generateBulkInvoicePdfs(invoiceIds, 'binary');

      // Prepare ZIP file entries
      const zipFiles: ZipFileEntry[] = [];
      const manifestData: ZipManifestEntry[] = [];

      for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];
        const invoice = invoiceMap.get(invoiceId);
        const hcf = invoice ? hcfMap.get(invoice.hcfId) : null;
        const pdfBuffer = pdfBuffers[i];

        // Ensure we have a Buffer
        const buffer = Buffer.isBuffer(pdfBuffer)
          ? pdfBuffer
          : Buffer.from(pdfBuffer as any);

        // Create a descriptive filename
        const invoiceNum = invoice?.invoiceNumber || invoiceId;
        const hcfName = hcf?.hcfName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
        const fileName = `${invoiceNum}_${hcfName}.pdf`;

        zipFiles.push({
          name: fileName,
          buffer,
        });

        // Add manifest entry
        if (includeManifest && invoice) {
          const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
          manifestData.push({
            fileName,
            invoiceId,
            hcfName: hcf?.hcfName || 'Unknown',
            invoiceNumber: invoice.invoiceNumber,
            month: invoiceDate?.getMonth() ? invoiceDate.getMonth() + 1 : undefined,
            year: invoiceDate?.getFullYear(),
            generatedAt: new Date().toISOString(),
          });
        }
      }

      // Generate ZIP
      const zipBuffer = await ZipGenerator.generateZipFromBuffers(zipFiles, {
        includeManifest,
        manifestData,
        compressionLevel: 6,
      });

      const filename = ZipGenerator.generateZipFilename('invoices');

      const duration = Date.now() - startTime;
      this.logger.debug(
        `ZIP generation completed: ${invoiceIds.length} PDFs in ${duration}ms, ZIP size: ${(zipBuffer.length / 1024).toFixed(2)} KB`,
      );

      return { buffer: zipBuffer, filename };
    } catch (error) {
      this.logger.error('Error generating ZIP:', error);
      throw error;
    }
  }

  /**
   * Get company with caching (fetches raw entity data for PDF generation)
   */
  private async getCompanyWithCache(companyId: string): Promise<any> {
    const cached = this.companyCache.get(companyId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Fetch raw entity data directly from TypeORM for PDF generation
    // This gives us access to all database fields, not just domain entity fields
    const companyEntity = await this.companyEntityRepository.findOne({
      where: { companyId, isDeleted: false },
    });

    if (!companyEntity) {
      this.logger.warn(`Company entity not found: ${companyId}`);
      return null;
    }

    // Convert entity to plain object for easier property access
    const companyData = {
      companyId: companyEntity.companyId,
      companyCode: companyEntity.companyCode,
      companyName: companyEntity.companyName,
      status: companyEntity.status,
      // Note: Company entity only has basic fields
      // Additional fields like gstin, bank details, etc. are not in the current schema
      // Using fallback values in prepareTemplateData
    };

    this.logger.debug(`Company cached: ${companyId}`);
    this.companyCache.set(companyId, { data: companyData, timestamp: now });

    // Auto-cleanup old cache entries
    this.cleanupCache(this.companyCache);

    return companyData;
  }

  /**
   * Get HCF with caching (fetches raw entity data for PDF generation)
   */
  private async getHcfWithCache(hcfId: string): Promise<any> {
    const cached = this.hcfCache.get(hcfId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Fetch raw entity data directly from TypeORM for PDF generation
    // This gives us access to all database fields like billingAddress, gstin, etc.
    const hcfEntity = await this.hcfEntityRepository.findOne({
      where: { hcfId, isDeleted: false },
    });

    if (!hcfEntity) {
      this.logger.warn(`HCF entity not found: ${hcfId}`);
      return null;
    }

    // Convert entity to plain object with all fields needed for PDF
    const hcfData = {
      hcfId: hcfEntity.hcfId,
      hcfCode: hcfEntity.hcfCode,
      hcfName: hcfEntity.hcfName,
      billingName: hcfEntity.billingName,
      billingAddress: hcfEntity.billingAddress,
      serviceAddress: hcfEntity.serviceAddress,
      gstin: hcfEntity.gstin,
      stateCode: hcfEntity.stateCode,
      // Include other fields that might be needed
      district: hcfEntity.district,
      pincode: hcfEntity.pincode,
    };

    this.logger.debug(`HCF cached: ${hcfId}`);
    this.hcfCache.set(hcfId, { data: hcfData, timestamp: now });

    // Auto-cleanup old cache entries
    this.cleanupCache(this.hcfCache);

    return hcfData;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(cache: Map<string, { data: any; timestamp: number }>): void {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        cache.delete(key);
      }
    }
  }

  /**
   * Find multiple invoices by IDs (helper method)
   */
  private async findByIds(invoiceIds: string[]): Promise<any[]> {
    const invoices = await Promise.all(
      invoiceIds.map((id) => this.invoiceRepository.findById(id)),
    );
    return invoices.filter((inv) => inv !== null);
  }

  /**
   * Find multiple companies by IDs (helper method)
   */
  private async findCompaniesByIds(companyIds: string[]): Promise<any[]> {
    const companies = await Promise.all(
      companyIds.map((id) => this.companyRepository.findById(id)),
    );
    return companies.filter((c) => c !== null);
  }

  /**
   * Find multiple HCFs by IDs (helper method)
   */
  private async findHcfsByIds(hcfIds: string[]): Promise<any[]> {
    const hcfs = await Promise.all(
      hcfIds.map((id) => this.hcfRepository.findById(id)),
    );
    return hcfs.filter((h) => h !== null);
  }

  /**
   * Prepare template data from invoice, company, and HCF entities
   */
  private async prepareTemplateData(invoice: any, company: any, hcf: any): Promise<InvoiceTemplateData> {
    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Calculate totals based on billing type
    let description = '';
    let quantity = '';

    // Determine if this is a yearly invoice (billingPeriodStart is null or billingType is 'Yearly')
    const isYearlyInvoice = invoice.billingPeriodStart === null || invoice.billingType === 'Yearly';
    
    // Extract month and year from billingPeriodStart or invoiceDate
    let billingMonth: number | null = null;
    let billingYear: number | null = null;
    
    if (invoice.billingPeriodStart) {
      const periodStart = new Date(invoice.billingPeriodStart);
      billingMonth = periodStart.getMonth() + 1;
      billingYear = periodStart.getFullYear();
    } else if (invoice.invoiceDate) {
      const invoiceDate = new Date(invoice.invoiceDate);
      billingMonth = invoiceDate.getMonth() + 1;
      billingYear = invoiceDate.getFullYear();
    }

    const periodDescription = isYearlyInvoice 
      ? `the year ${billingYear || new Date().getFullYear()}` 
      : `the month of ${this.getMonthNameFromNumber(billingMonth || 1)} ${billingYear || new Date().getFullYear()}`;

    // Get billing days from invoice.billingDays or calculate from period
    const daysInMon = invoice.billingDays || (invoice.billingPeriodStart && invoice.billingPeriodEnd
      ? Math.ceil((new Date(invoice.billingPeriodEnd).getTime() - new Date(invoice.billingPeriodStart).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : null);

    if (invoice.billingOption === 'Bed-wise') {
      description = `Bio-Medical Waste Treatment & Disposal charges for ${periodDescription}`;
      quantity = daysInMon 
        ? `${invoice.bedCount} Beds x Rs.${invoice.bedRate}/Bed x ${daysInMon} Days`
        : `${invoice.bedCount} Beds x Rs.${invoice.bedRate}/Bed`;
    } else if (invoice.billingOption === 'Weight-wise') {
      description = `Bio-Medical Waste Treatment & Disposal charges for ${periodDescription}`;
      quantity = `${invoice.weightInKg} Kgs x Rs.${invoice.kgRate}/Kg`;
    } else if (invoice.billingOption === 'Lumpsum') {
      description = `Bio-Medical Waste Treatment & Disposal charges for ${periodDescription}`;
      quantity = `Lumpsum Charges`;
    }

    // Convert all numeric values
    const taxableValue = toNumber(invoice.taxableValue);
    const cgstAmount = toNumber(invoice.cgst);
    const sgstAmount = toNumber(invoice.sgst);
    const igstAmount = toNumber(invoice.igst);
    const roundOff = toNumber(invoice.roundOff);
    const invoiceValue = toNumber(invoice.invoiceValue);

    // Determine if IGST or CGST+SGST
    const isIGST = igstAmount > 0;
    const cgstRate = isIGST ? 0 : (cgstAmount > 0 ? 9 : 0);
    const sgstRate = isIGST ? 0 : (sgstAmount > 0 ? 9 : 0);
    const igstRate = isIGST ? 18 : 0;

    const invoiceTotalInWords = this.numberToWords(Math.round(invoiceValue));

    // Format company address from database fields
    // Note: Company entity currently only has basic fields (companyId, companyCode, companyName, status)
    // Additional fields like addresses, GSTIN, bank details are not in the current schema
    // Using fallback/default values for PDF generation
    const companyAddress = 'Address not available'; // Company entity doesn't have address fields
    const companyStateCode = '33'; // Default state code

    return {
      // Company Details
      companyName: company?.companyName || 'ABC BMW Solution Pvt Ltd',
      companyAddress: companyAddress,
      adminAddress: 'Address not available', // Company entity doesn't have this field
      companyTel: 'Not available', // Company entity doesn't have contact field
      companyGSTIN: '33AAAAA0000A1Z5', // Default GSTIN - Company entity doesn't have this field
      companyLogo: undefined,

      // Invoice Details
      invoiceNum: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate instanceof Date 
        ? invoice.invoiceDate.toISOString().split('T')[0]
        : invoice.invoiceDate,
      reverseCharge: 'No',
      stateCode: companyStateCode,

      // Bill To (HCF)
      hcfName: hcf?.billingName || hcf?.hcfName || 'Not available',
      hcfAddress: hcf?.billingAddress || hcf?.serviceAddress || 'Address not available',
      hcfGSTIN: hcf?.gstin || 'Not available',
      hcfState: hcf?.stateCode ? 'TamilNadu' : 'TamilNadu', // Can be enhanced to map state code to state name

      // Line Items
      description,
      taxableValue,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      lineTotal: invoiceValue,

      // Totals
      totalTaxableValue: taxableValue,
      totalCGST: cgstAmount,
      totalSGST: sgstAmount,
      totalIGST: igstAmount,
      roundOff,
      invoiceTotal: invoiceValue,
      invoiceTotalInWords,

      // Bank Details
      // Note: Company entity doesn't have bank details fields - using defaults
      bankAccountNumber: 'Not available', // Company entity doesn't have this field
      bankBranch: 'Not available', // Company entity doesn't have this field
      bankIFSC: 'Not available', // Company entity doesn't have this field
      upiId: 'Not available', // Company entity doesn't have this field
      webLoginId: hcf?.hcfCode || 'Not available',
      website: 'www.abcbmw.com', // Default website - Company entity doesn't have this field

      // Additional Details
      sacCode: '998599', // Default SAC code - Company entity doesn't have this field
      quantity,
      billingDescription: `SAC Code: 998599`,

      // QR Code - contains Invoice Number and Amount
      qrCodeDataUrl: await this.generateQRCode(invoice.invoiceNumber, invoiceValue),
    };
  }

  /**
   * Generate QR Code Data URL from invoice number and amount
   */
  private async generateQRCode(invoiceNum: string, amount: number): Promise<string | undefined> {
    try {
      // Format QR code data to include both invoice number and amount
      const qrData = `Invoice: ${invoiceNum}\nAmount: ₹${amount.toFixed(2)}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      return qrCodeDataUrl;
    } catch (error) {
      this.logger.warn(`Failed to generate QR code for invoice ${invoiceNum}:`, error);
      return undefined;
    }
  }

  /**
   * Convert HTML to PDF buffer or base64 string
   */
  private async htmlToPdfBuffer(htmlContent: string, invoiceNum: string, format?: string): Promise<Buffer | string> {
    const normalizedFormat = format?.trim().toLowerCase();
    
    const options: PDFOptions = {
      filename: PdfGeneratorUtil.formatFileName(invoiceNum),
      margin: 10,
      page: {
        format: 'a4',
        orientation: 'portrait',
      },
      encoding: normalizedFormat === 'base64' ? 'base64' : 'binary',
    };

    this.logger.debug(`Generating PDF with encoding: ${options.encoding}`);
    let result = await PdfGeneratorUtil.generatePdf(htmlContent, options);
    
    // Ensure result is proper type
    if (options.encoding === 'base64') {
      // If it's a Buffer, convert to base64 string
      if (Buffer.isBuffer(result)) {
        result = result.toString('base64');
      }
      // Result should now be a string - do NOT call String() on it again
      this.logger.debug(`Base64 string length: ${(result as string).length}`);
    } else {
      // Ensure it's a Buffer
      if (typeof result === 'string') {
        result = Buffer.from(result, 'binary');
      }
      this.logger.debug(`PDF Buffer length: ${(result as Buffer).length}`);
    }

    return result;
  }

  /**
   * Get month name from date
   */
  private getMonthName(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Get month name from month number (1-12)
   */
  private getMonthNameFromNumber(monthNumber: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1] || 'Invalid Month';
  }

  /**
   * Convert number to words (for Indian Rupees format)
   */
  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    let words = '';
    let scaleIndex = 0;

    while (num > 0) {
      let groupOfThree = num % 1000;
      if (groupOfThree !== 0) {
        words = this.convertGroupToWords(groupOfThree, ones, teens, tens) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + ' ' + words;
      }

      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return words.trim() + ' Only';
  }

  /**
   * Convert group of three digits to words
   */
  private convertGroupToWords(num: number, ones: string[], teens: string[], tens: string[]): string {
    const ones_array = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens_array = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens_array = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    let result = '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundreds > 0) {
      result += ones_array[hundreds] + ' Hundred';
    }

    if (remainder > 0) {
      if (hundreds > 0) result += ' ';

      if (remainder < 10) {
        result += ones_array[remainder];
      } else if (remainder < 20) {
        result += teens_array[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;
        result += tens_array[ten];
        if (one > 0) {
          result += ' ' + ones_array[one];
        }
      }
    }

    return result.trim();
  }
}
