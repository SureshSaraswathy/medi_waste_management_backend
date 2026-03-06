import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  MasterDataNotFoundException,
  DuplicateMasterDataException,
} from '../base/master-data.exceptions';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    // Handle HttpException (already properly formatted)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }
    // Handle custom master data exceptions
    else if (exception instanceof MasterDataNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    }
    else if (exception instanceof DuplicateMasterDataException) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    }
    // Handle regular Error instances
    else if (exception instanceof Error) {
      // Check for specific error types by name
      if (exception.name === 'PastFinanceYearException' || exception.message.includes('Past financial years')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
      }
      else if (exception.name === 'DuplicateFinanceYearException' || exception.message.includes('already exists')) {
        status = HttpStatus.CONFLICT;
        message = exception.message;
      }
      else {
        message = exception.message || 'Internal server error';
      }
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    const errorResponse: any = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as { message: string }).message,
    };

    // In development, include stack trace for debugging
    if (isDevelopment && exception instanceof Error) {
      errorResponse.error = exception.message;
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
