/**
 * Invoice Template Utility
 * Generates HTML template for tax invoices
 */

export interface InvoiceTemplateData {
  // Company Details
  companyName: string;
  adminAddress: string;
  companyAddress: string;
  companyTel: string;
  companyGSTIN: string;
  companyLogo?: string;

  // Invoice Details
  invoiceNum: string;
  invoiceDate: string;
  reverseCharge?: string;
  stateCode?: string;

  // Bill To (HCF)
  hcfName: string;
  hcfAddress: string;
  hcfGSTIN: string;
  hcfState: string;

  // Line Items
  description: string;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  lineTotal: number;

  // Totals
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  invoiceTotal: number;
  invoiceTotalInWords: string;

  // Bank Details
  bankAccountNumber: string;
  bankBranch: string;
  bankIFSC: string;
  upiId?: string;
  webLoginId?: string;
  website?: string;

  // Additional Details
  sacCode?: string;
  quantity?: string;
  billingDescription?: string;

  // QR Code
  qrCodeDataUrl?: string;
}

export class InvoiceTemplateUtil {
  /**
   * Generate HTML for tax invoice
   */
  static generateInvoiceHTML(data: InvoiceTemplateData): string {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Invoice - ${data.invoiceNum}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          .invoice-container {
            max-width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 15px;
            background: white;
            page-break-after: always;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .company-header {
            flex: 1;
          }
          .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .company-address {
            font-size: 10px;
            line-height: 1.3;
            margin-bottom: 5px;
          }
          .company-contact {
            font-size: 9px;
            margin-bottom: 2px;
          }
          .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            flex: 1;
            margin: 0 20px;
          }
          .invoice-header-info {
            font-size: 10px;
            text-align: right;
          }
          .invoice-header-info div {
            margin-bottom: 2px;
          }
          .row {
            display: flex;
            margin-bottom: 8px;
          }
          .section-title {
            font-weight: bold;
            font-size: 10px;
            padding: 4px 0;
            border-bottom: 1px solid #999;
            margin-bottom: 4px;
          }
          .bill-to-section,
          .bill-from-section {
            display: inline-block;
            width: 48%;
            margin-right: 2%;
            vertical-align: top;
          }
          .bill-from-section {
            margin-right: 0;
          }
          .bill-details {
            font-size: 10px;
            line-height: 1.5;
          }
          .bill-details div {
            margin-bottom: 2px;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            min-width: 70px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th {
            background-color: #e8e8e8;
            border: 1px solid #999;
            padding: 5px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
          }
          td {
            border: 1px solid #999;
            padding: 5px;
            font-size: 10px;
          }
          tr.item-row td {
            text-align: right;
          }
          tr.item-row td:first-child {
            text-align: left;
          }
          tr.total-row td {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: right;
          }
          tr.total-row td:first-child {
            text-align: left;
            background-color: transparent;
            font-weight: bold;
          }
          .tax-summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
          }
          .tax-summary-box {
            width: 45%;
            border: 1px solid #999;
            font-size: 9px;
          }
          .tax-summary-row {
            display: flex;
            border-bottom: 1px solid #999;
            padding: 3px;
          }
          .tax-summary-row:last-child {
            border-bottom: none;
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .tax-summary-label {
            flex: 1;
            text-align: left;
          }
          .tax-summary-value {
            flex: 1;
            text-align: right;
            min-width: 80px;
          }
          .totals-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .amount-in-words {
            flex: 1;
            padding: 5px;
            border: 1px solid #999;
            font-size: 9px;
            min-height: 30px;
            display: flex;
            align-items: center;
          }
          .bank-details {
            border: 1px solid #999;
            padding: 8px;
            font-size: 9px;
            margin-bottom: 8px;
          }
          .bank-details-row {
            display: flex;
            margin-bottom: 2px;
          }
          .bank-details-label {
            font-weight: bold;
            min-width: 80px;
          }
          .bank-details-value {
            flex: 1;
          }
          .qr-code {
            text-align: center;
            margin-bottom: 10px;
          }
          .qr-code img {
            max-width: 80px;
            height: auto;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            border-top: 1px solid #999;
            padding-top: 10px;
            min-height: 60px;
          }
          .footer-section {
            flex: 1;
            text-align: center;
          }
          .signature-line {
            margin-top: 20px;
            border-top: 1px solid #000;
            margin-left: 20px;
          }
          .centered {
            text-align: center;
          }
          .right-align {
            text-align: right;
          }
          .bold {
            font-weight: bold;
          }
          .gst-no {
            font-size: 9px;
            margin-top: 2px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .invoice-container {
              max-width: 100%;
              height: auto;
              margin: 0;
              padding: 0;
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <table style="width: 100%; border: 1px solid #000; margin-bottom: 5px;">
            <tr>
              <td style="width: 15%; text-align: center; padding: 10px; border-right: 1px solid #000;">
                <div style="font-size: 10px;">Company<br/>Logo</div>
              </td>
              <td style="width: 55%; text-align: center; padding: 5px; border-right: 1px solid #000;">
                <div style="font-size: 16px; font-weight: bold; color: #0066cc;">${InvoiceTemplateUtil.escapeHtml(data.companyName)}</div>
                <div style="font-size: 10px;">${InvoiceTemplateUtil.escapeHtml(data.companyAddress)}</div>
                <div style="font-size: 10px;">${InvoiceTemplateUtil.escapeHtml(data.adminAddress)}</div>
                <div style="font-size: 10px;">Tel: ${InvoiceTemplateUtil.escapeHtml(data.companyTel)}</div>
                <div style="font-size: 10px;">GSTIN: ${InvoiceTemplateUtil.escapeHtml(data.companyGSTIN)}</div>
              </td>
              <td style="width: 30%; text-align: center; padding: 10px; font-size: 10px;">
                Original for Recipient
              </td>
            </tr>
          </table>

          <!-- Tax Invoice Banner -->
          <div style="background: linear-gradient(to right, #a8d4ff, #e0f0ff); padding: 10px; text-align: center; margin-bottom: 5px; border: 1px solid #999;">
            <span style="font-size: 24px; font-weight: bold; color: #cc0000;">Tax Invoice</span>
          </div>

          <!-- Invoice Details Row -->
          <table style="width: 100%; border: 1px solid #000; margin-bottom: 5px; font-size: 10px;">
            <tr>
              <td style="padding: 3px; border-right: 1px solid #000; border-bottom: 1px solid #000;"><strong>Invoice No:</strong> ${InvoiceTemplateUtil.escapeHtml(data.invoiceNum)}</td>
              <td style="padding: 3px; border-bottom: 1px solid #000;"><strong>Invoice date:</strong> ${InvoiceTemplateUtil.formatDate(data.invoiceDate)}</td>
            </tr>
            <tr>
              <td style="padding: 3px; border-right: 1px solid #000; border-bottom: 1px solid #000;"><strong>Reverse Charge (Y/N):</strong></td>
              <td style="padding: 3px; border-bottom: 1px solid #000;">${data.reverseCharge || 'No'}</td>
            </tr>
            <tr>
              <td style="padding: 3px; border-right: 1px solid #000;"><strong>State:</strong> TamilNadu</td>
              <td style="padding: 3px;"><strong>Code</strong> ${data.stateCode || '33'}</td>
            </tr>
          </table>

          <!-- Bill to Party Section -->
          <table style="width: 100%; border: 1px solid #000; margin-bottom: 5px; font-size: 10px;">
            <tr>
              <td colspan="2" style="padding: 3px; background-color: #f0f0f0; border-bottom: 1px solid #000;"><strong>Bill to Party</strong></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px; border-bottom: 1px solid #000;"><strong>Name:</strong> ${InvoiceTemplateUtil.escapeHtml(data.hcfName)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px; border-bottom: 1px solid #000;"><strong>Address:</strong> ${InvoiceTemplateUtil.escapeHtml(data.hcfAddress)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px; border-bottom: 1px solid #000;"></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 3px; border-bottom: 1px solid #000;"><strong>GSTIN:</strong> ${InvoiceTemplateUtil.escapeHtml(data.hcfGSTIN)}</td>
            </tr>
            <tr>
              <td style="padding: 3px; border-right: 1px solid #000;"><strong>State:</strong> ${InvoiceTemplateUtil.escapeHtml(data.hcfState)}</td>
              <td style="padding: 3px;"><strong>Code</strong> ${data.stateCode || '33'}</td>
            </tr>
          </table>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 5%; text-align: center;">S.<br/>No.</th>
                <th rowspan="2" style="width: 35%;">Product Description</th>
                <th rowspan="2" style="width: 12%; text-align: right;">Taxable Value</th>
                ${data.igstRate > 0 ? `
                  <th colspan="2" style="text-align: center;">IGST</th>
                ` : `
                  <th colspan="2" style="text-align: center;">CGST</th>
                  <th colspan="2" style="text-align: center;">SGST</th>
                `}
                <th rowspan="2" style="width: 12%; text-align: right;">Total</th>
              </tr>
              <tr>
                ${data.igstRate > 0 ? `
                  <th style="width: 6%; text-align: center;">Rate</th>
                  <th style="width: 10%; text-align: right;">Amount</th>
                ` : `
                  <th style="width: 6%; text-align: center;">Rate</th>
                  <th style="width: 10%; text-align: right;">Amount</th>
                  <th style="width: 6%; text-align: center;">Rate</th>
                  <th style="width: 10%; text-align: right;">Amount</th>
                `}
              </tr>
            </thead>
            <tbody>
              <tr class="item-row">
                <td rowspan="3" style="text-align: center; vertical-align: top;">1)</td>
                <td>${InvoiceTemplateUtil.escapeHtml(data.description)}</td>
                <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.taxableValue)}</td>
                ${data.igstRate > 0 ? `
                  <td style="text-align: center;">${data.igstRate}</td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.igstAmount)}</td>
                ` : `
                  <td style="text-align: center;">${data.cgstRate}</td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.cgstAmount)}</td>
                  <td style="text-align: center;">${data.sgstRate}</td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.sgstAmount)}</td>
                `}
                <td style="text-align: right;">₹ ${InvoiceTemplateUtil.formatCurrency(data.lineTotal)}</td>
              </tr>
              <tr>
                <td colspan="${data.igstRate > 0 ? '5' : '7'}" style="border-top: none; padding-top: 2px;">SAC Code: ${data.sacCode || '999491'}</td>
              </tr>
              ${data.quantity ? `
              <tr>
                <td colspan="${data.igstRate > 0 ? '5' : '7'}" style="border-top: none; padding-top: 2px;">${InvoiceTemplateUtil.escapeHtml(data.quantity)}</td>
              </tr>
              ` : ''}
              <!-- Empty rows for spacing like in sample -->
              <tr style="height: 80px;">
                <td></td>
                <td colspan="${data.igstRate > 0 ? '5' : '7'}"></td>
              </tr>
              <tr class="total-row">
                <td colspan="2" style="text-align: center; font-weight: bold; font-size: 14px;">Total</td>
                <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.totalTaxableValue)}</td>
                ${data.igstRate > 0 ? `
                  <td></td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.totalIGST)}</td>
                ` : `
                  <td></td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.totalCGST)}</td>
                  <td></td>
                  <td style="text-align: right;">${InvoiceTemplateUtil.formatCurrency(data.totalSGST)}</td>
                `}
                <td style="text-align: right;">₹ ${InvoiceTemplateUtil.formatCurrency(data.invoiceTotal)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount in Words and Tax Summary -->
          <div style="display: flex; margin-bottom: 10px;">
            <div style="flex: 1; border: 1px solid #999; padding: 5px;">
              <div style="font-weight: bold; font-size: 10px; margin-bottom: 5px;">Total Invoice amount in words</div>
              <div style="font-size: 10px;">${InvoiceTemplateUtil.escapeHtml(data.invoiceTotalInWords)}</div>
            </div>
            ${data.qrCodeDataUrl ? `
            <div style="width: 100px; text-align: center; padding: 5px;">
              <img src="${data.qrCodeDataUrl}" alt="QR Code" style="max-width: 80px; height: auto;" />
            </div>
            ` : ''}
            <div style="width: 200px; border: 1px solid #999; font-size: 9px;">
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Total Amount before Tax</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalTaxableValue)}</span>
              </div>
              ${data.igstRate > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Add: IGST</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalIGST)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Total Tax Amount</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalIGST)}</span>
              </div>
              ` : `
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Add: CGST</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalCGST)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Add: SGST</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalSGST)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Total Tax Amount</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.totalCGST + data.totalSGST)}</span>
              </div>
              `}
              <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #999;">
                <span>Rounded Off</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.roundOff)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 3px; font-weight: bold; background-color: #f0f0f0;">
                <span>Total Amount after Tax:</span>
                <span>₹ ${InvoiceTemplateUtil.formatCurrency(data.invoiceTotal)}</span>
              </div>
            </div>
          </div>

          <!-- Bank Details and Signature Section -->
          <table style="width: 100%; border: 1px solid #000; font-size: 9px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding: 0;">
                <div style="background-color: #f0f0f0; padding: 3px; border-bottom: 1px solid #000; text-align: center;"><strong>Bank Details</strong></div>
                <div style="padding: 3px;"><strong>Bank A/C:</strong> ${InvoiceTemplateUtil.escapeHtml(data.bankAccountNumber)}</div>
                <div style="padding: 3px;"><strong>Bank Branch:</strong> ${InvoiceTemplateUtil.escapeHtml(data.bankBranch)}</div>
                <div style="padding: 3px;"><strong>Bank IFSC:</strong> ${InvoiceTemplateUtil.escapeHtml(data.bankIFSC)}</div>
                <div style="padding: 3px;"><strong>Cheque / DD to be drawn in fvr of "${InvoiceTemplateUtil.escapeHtml(data.companyName)}"</strong></div>
                ${data.upiId ? `<div style="padding: 3px;"><strong>Our UPI ID:</strong> ${InvoiceTemplateUtil.escapeHtml(data.upiId)}</div>` : ''}
                ${data.webLoginId ? `<div style="padding: 3px;"><strong>Your Web Login to make payment:</strong> ${InvoiceTemplateUtil.escapeHtml(data.webLoginId)}</div>` : ''}
                ${data.website ? `<div style="padding: 3px;"><strong>Visit our site to make payment:</strong> ${InvoiceTemplateUtil.escapeHtml(data.website)}</div>` : ''}
              </td>
              <td style="width: 50%; vertical-align: top; border-left: 1px solid #000; padding: 5px;">
                <div style="font-size: 8px; margin-bottom: 10px;">Certified that the particulars given above are true and correct</div>
                <div style="text-align: center; margin-top: 30px;">
                  <div><strong>For ${InvoiceTemplateUtil.escapeHtml(data.companyName)}</strong></div>
                  <div style="margin-top: 40px; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">
                    <strong>Authorised signatory</strong>
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  /**
   * Format date to DD-MM-YYYY
   */
  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }

  /**
   * Format number as currency with 2 decimal places
   */
  private static formatCurrency(value: any): string {
    if (value === null || value === undefined) return '0.00';
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    if (!text) return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }
}
