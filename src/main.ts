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
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const port = appConfig.port || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📝 Environment: ${appConfig.nodeEnv}`);
}

bootstrap();
