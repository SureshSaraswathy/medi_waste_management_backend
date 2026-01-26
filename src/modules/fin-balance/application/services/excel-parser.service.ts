import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateFinBalanceDto } from '../dto/create-fin-balance.dto';

export interface ExcelRow {
  [key: string]: any;
}

@Injectable()
export class ExcelParserService {
  /**
   * Parse Excel file and extract FinBalance records
   * Expected columns: Company Code, HCF Code, Opening Balance, Notes (optional)
   */
  parseFinBalanceExcel(fileBuffer: Buffer): ExcelRow[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
    return data;
  }

  /**
   * Validate and map Excel rows to CreateFinBalanceDto
   * Maps: Company Code -> companyId, HCF Code -> hcfId
   */
  async mapExcelRowsToDto(
    rows: ExcelRow[],
    companyCodeMap: Map<string, string>, // companyCode -> companyId
    hcfCodeMap: Map<string, string>, // hcfCode -> hcfId
  ): Promise<{ valid: CreateFinBalanceDto[]; errors: Array<{ row: number; message: string; data: any }> }> {
    const valid: CreateFinBalanceDto[] = [];
    const errors: Array<{ row: number; message: string; data: any }> = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract values (case-insensitive column matching)
        const companyCode = this.getColumnValue(row, ['Company Code', 'CompanyCode', 'company_code', 'companycode']);
        const hcfCode = this.getColumnValue(row, ['HCF Code', 'HCFCode', 'hcf_code', 'hcfcode']);
        const openingBalance = this.getColumnValue(row, ['Opening Balance', 'OpeningBalance', 'opening_balance', 'openingbalance']);
        const notes = this.getColumnValue(row, ['Notes', 'notes'], true);

        // Validation
        if (!companyCode) {
          errors.push({ row: rowNumber, message: 'Company Code is required', data: row });
          return;
        }

        if (!hcfCode) {
          errors.push({ row: rowNumber, message: 'HCF Code is required', data: row });
          return;
        }

        const companyId = companyCodeMap.get(companyCode);
        if (!companyId) {
          errors.push({ row: rowNumber, message: `Company Code "${companyCode}" not found`, data: row });
          return;
        }

        const hcfId = hcfCodeMap.get(hcfCode);
        if (!hcfId) {
          errors.push({ row: rowNumber, message: `HCF Code "${hcfCode}" not found`, data: row });
          return;
        }

        const openingBalanceNum = parseFloat(String(openingBalance));
        if (isNaN(openingBalanceNum) || openingBalanceNum < 0) {
          errors.push({ row: rowNumber, message: 'Opening Balance must be a valid number >= 0', data: row });
          return;
        }

        valid.push({
          companyId,
          hcfId,
          openingBalance: openingBalanceNum,
          notes: notes || null,
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: row,
        });
      }
    });

    return { valid, errors };
  }

  private getColumnValue(row: ExcelRow, possibleNames: string[], optional: boolean = false): any {
    for (const name of possibleNames) {
      // Try exact match
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
      // Try case-insensitive match
      const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
      if (key && row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    if (!optional) {
      throw new Error(`Column not found: ${possibleNames.join(' or ')}`);
    }
    return null;
  }
}
