export class InvalidPaymentAmountException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentAmountException';
  }
}

export class InvalidInvoiceStatusException extends Error {
  constructor(invoiceNumber: string, status: string, customMessage?: string) {
    super(customMessage || `Invoice ${invoiceNumber} has status '${status}' and cannot be paid. Only 'Generated' or 'Partially Paid' invoices can be paid.`);
    this.name = 'InvalidInvoiceStatusException';
  }
}

export class InsufficientPaymentAmountException extends Error {
  constructor(requiredAmount: number, providedAmount: number, customMessage?: string) {
    super(customMessage || `Insufficient payment amount. Required: ${requiredAmount}, Provided: ${providedAmount}`);
    this.name = 'InsufficientPaymentAmountException';
  }
}

export class PaymentNotFoundException extends Error {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`);
    this.name = 'PaymentNotFoundException';
  }
}

export class ReceiptNotFoundException extends Error {
  constructor(receiptId: string) {
    super(`Receipt with ID ${receiptId} not found`);
    this.name = 'ReceiptNotFoundException';
  }
}

export class DuplicateReceiptNumberException extends Error {
  constructor(receiptNumber: string) {
    super(`Receipt number ${receiptNumber} already exists`);
    this.name = 'DuplicateReceiptNumberException';
  }
}
