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
  // - development / "*" : reflect request origin (LAN IP, localhost, phone demo)
  // - single origin string: "http://localhost:5173"
  // - comma-separated list: "http://localhost:5173,https://app.example.com"
  const isDev = (appConfig.nodeEnv || 'development') !== 'production';
  const corsOriginRaw = appConfig.corsOrigin;
  const origin =
    isDev || corsOriginRaw === '*' || !corsOriginRaw
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
  const host = appConfig.host || '0.0.0.0';
  await app.listen(port, host);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`🌐 LAN/demo bind: http://${host}:${port}/api/v1`);
  console.log(`📝 Environment: ${appConfig.nodeEnv}`);
}

bootstrap();
