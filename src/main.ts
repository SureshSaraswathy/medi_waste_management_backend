import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { CustomExceptionFilter } from './common/exceptions/custom-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appConfig = configService.get('app');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter for better error handling
  app.useGlobalFilters(new CustomExceptionFilter());

  // CORS configuration
  // Support:
  // - single origin string: "http://localhost:5173"
  // - comma-separated list: "http://localhost:5173,http://192.168.1.10:5173"
  // - "*" (dev): reflect request origin (safe with credentials)
  const corsOriginRaw = appConfig.corsOrigin;
  const origin =
    corsOriginRaw === '*' || !corsOriginRaw
      ? true
      : typeof corsOriginRaw === 'string' && corsOriginRaw.includes(',')
        ? (requestOrigin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
            if (!requestOrigin) return cb(null, true);
            const allowed = corsOriginRaw
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
            return cb(null, allowed.includes(requestOrigin));
          }
        : corsOriginRaw;

  app.enableCors({ origin, credentials: true });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = appConfig.port || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📝 Environment: ${appConfig.nodeEnv}`);
}

bootstrap();
