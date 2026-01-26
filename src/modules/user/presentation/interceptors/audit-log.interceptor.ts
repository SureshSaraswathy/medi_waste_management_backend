import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, user } = request;
    const userId = user?.userId || 'anonymous';
    const timestamp = new Date().toISOString();

    const logData = {
      timestamp,
      userId,
      method,
      url,
      params,
      body: this.sanitizeBody(body),
    };

    this.logger.log(`[AUDIT] ${JSON.stringify(logData)}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logger.log(
            `[AUDIT SUCCESS] ${method} ${url} - User: ${userId} - ${timestamp}`,
          );
        },
        error: (error) => {
          this.logger.error(
            `[AUDIT ERROR] ${method} ${url} - User: ${userId} - Error: ${error.message} - ${timestamp}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    // Remove sensitive fields from logs
    if (sanitized.password) sanitized.password = '***REDACTED***';
    if (sanitized.otp) sanitized.otp = '***REDACTED***';
    return sanitized;
  }
}
