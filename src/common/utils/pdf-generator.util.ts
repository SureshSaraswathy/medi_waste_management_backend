/**
 * PDF Generator Utility
 * Converts HTML to PDF using server-side approach
 * Primary: Puppeteer (recommended for production)
 * Fallback: html2canvas + jsPDF (client-side compatible)
 */
import { Browser } from 'puppeteer';

export interface PDFOptions {
  filename?: string;
  margin?: number | [number, number] | [number, number, number, number];
  page?: {
    format?: 'a4' | 'letter' | 'legal' | 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
  };
  encoding?: 'base64' | 'binary';
}

export class PdfGeneratorUtil {
  private static browserInstance: Browser | null = null;
  private static browserPromise: Promise<Browser> | null = null;
  private static lastUsedTime: number = 0;
  private static readonly BROWSER_IDLE_TIMEOUT = 300000; // 5 minutes

  /**
   * Get or create shared browser instance
   * Reuses browser instance for better performance
   */
  static async getBrowser(): Promise<Browser> {
    // If browser exists and is connected, return it
    if (this.browserInstance && this.browserInstance.isConnected()) {
      this.lastUsedTime = Date.now();
      return this.browserInstance;
    }

    // If browser launch is in progress, wait for it
    if (this.browserPromise) {
      return this.browserPromise;
    }

    // Launch new browser
    this.browserPromise = require('puppeteer').launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.browserInstance = await this.browserPromise;
    this.browserPromise = null;
    this.lastUsedTime = Date.now();

    // Auto-close browser after idle timeout
    this.scheduleIdleCheck();

    return this.browserInstance!; // Non-null assertion as we just assigned it
  }

  /**
   * Schedule idle check to close browser if unused
   */
  private static scheduleIdleCheck(): void {
    setTimeout(async () => {
      const idleTime = Date.now() - this.lastUsedTime;
      if (idleTime >= this.BROWSER_IDLE_TIMEOUT && this.browserInstance) {
        await this.browserInstance.close();
        this.browserInstance = null;
      } else if (this.browserInstance) {
        // Reschedule if still active
        this.scheduleIdleCheck();
      }
    }, this.BROWSER_IDLE_TIMEOUT);
  }

  /**
   * Manually close browser instance
   */
  static async closeBrowser(): Promise<void> {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }

  /**
   * Generate PDF from HTML using Puppeteer (server-side)
   * Requires: npm install puppeteer
   * Best for production use
   * Returns: Buffer by default, or base64 string if encoding='base64'
   */
  static async generatePdfWithPuppeteer(
    htmlContent: string,
    options: PDFOptions = {},
  ): Promise<Buffer | string> {
    let page;
    try {
      // Use shared browser instance
      const browser = await this.getBrowser();
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const marginObj = this.parseMargin(options.margin);

      const pdfBuffer = await page.pdf({
        format: (options.page?.format || 'A4').toUpperCase() as any,
        landscape: options.page?.orientation === 'landscape',
        margin: marginObj,
      });

      // Close only the page, not the browser
      await page.close();

      // Convert to base64 if requested
      if (options.encoding === 'base64') {
        // Ensure it's a proper Node.js Buffer
        const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        const base64String = buffer.toString('base64');
        
        return base64String;
      }

      // Return as Buffer
      return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
    } catch (error) {
      // Ensure page is closed on error
      if (page) {
        await page.close().catch(() => {});
      }
      throw new Error(
        `Puppeteer PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Install: npm install puppeteer`,
      );
    }
  }

  /**
   * Generate PDF from HTML using html2canvas + jsPDF (browser-side compatible)
   * NOTE: This method is NOT supported in Node.js server environment
   * It requires a DOM environment (browser) which is not available in Node.js
   * This method is kept for reference but will always throw an error in server-side context
   * @deprecated Use generatePdfWithPuppeteer instead for server-side PDF generation
   */
  static async generatePdfWithHtml2Canvas(
    htmlContent: string,
    options: PDFOptions = {},
  ): Promise<Buffer> {
    // This method only works in browser environment, not in Node.js
    throw new Error(
      'HTML2Canvas is not supported in Node.js server environment. ' +
      'This method requires a DOM environment (browser). ' +
      'Please use Puppeteer for server-side PDF generation. ' +
      'Install: npm install puppeteer',
    );
  }

  /**
   * Generate PDF from HTML using Puppeteer (server-side)
   * This is the primary and only supported method for Node.js server environments
   * Returns: Buffer by default, or base64 string if encoding='base64'
   */
  static async generatePdf(
    htmlContent: string,
    options: PDFOptions = {},
  ): Promise<Buffer | string> {
    // Use Puppeteer for server-side PDF generation
    // This is the only method that works in Node.js environment
    return await this.generatePdfWithPuppeteer(htmlContent, options);
  }

  /**
   * Parse margin parameter to PDF format
   */
  private static parseMargin(
    margin?: number | [number, number] | [number, number, number, number],
  ): { top: number; bottom: number; left: number; right: number } {
    const defaultMargin = 10;

    if (!margin) {
      return {
        top: defaultMargin,
        bottom: defaultMargin,
        left: defaultMargin,
        right: defaultMargin,
      };
    }

    if (typeof margin === 'number') {
      return {
        top: margin,
        bottom: margin,
        left: margin,
        right: margin,
      };
    }

    if (Array.isArray(margin)) {
      if (margin.length === 2) {
        return {
          top: margin[0],
          bottom: margin[0],
          left: margin[1],
          right: margin[1],
        };
      }
      if (margin.length === 4) {
        return {
          top: margin[0],
          right: margin[1],
          bottom: margin[2],
          left: margin[3],
        };
      }
    }

    return {
      top: defaultMargin,
      bottom: defaultMargin,
      left: defaultMargin,
      right: defaultMargin,
    };
  }

  /**
   * Get MIME type for PDF
   */
  static getMimeType(): string {
    return 'application/pdf';
  }

  /**
   * Get file extension
   */
  static getFileExtension(): string {
    return 'pdf';
  }

  /**
   * Format filename for download
   */
  static formatFileName(baseFileName: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseFileName}-${timestamp}.pdf`;
  }
}
