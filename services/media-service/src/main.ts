import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [new winston.transports.Console()],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

  app.useBodyParser('json', {
    limit: process.env['MEDIA_JSON_LIMIT'] ?? '15mb',
  });
  app.useBodyParser('urlencoded', {
    extended: true,
    limit: process.env['MEDIA_URLENCODED_LIMIT'] ?? '15mb',
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins =
    process.env['CORS_ORIGINS']?.split(',').map((origin) => origin.trim()) ?? true;
  app.enableCors({ origin: corsOrigins, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lắc Lắc Media Service')
    .setDescription('Image upload APIs for Lắc Lắc')
    .setVersion('1.0')
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs/media', app, swaggerDoc);

  const port = Number(process.env['MEDIA_SERVICE_PORT'] ?? process.env['PORT'] ?? 3005);
  await app.listen(port);
}

void bootstrap();
