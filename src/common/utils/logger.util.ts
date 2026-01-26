export class Logger {
  private static formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${contextStr} ${message}`;
  }

  static log(message: string, context?: string): void {
    console.log(this.formatMessage('LOG', message, context));
  }

  static error(message: string, trace?: string, context?: string): void {
    console.error(this.formatMessage('ERROR', message, context));
    if (trace) {
      console.error(trace);
    }
  }

  static warn(message: string, context?: string): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static debug(message: string, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}
