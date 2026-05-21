import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  const app = await NestFactory.create(AppModule, { logger });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env['RABBITMQ_URL'] || 'amqp://localhost:5672'],
      queue: 'laclac_events_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
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
    .setTitle('Lắc Lắc Auth Service')
    .setDescription('Authentication APIs for Lắc Lắc')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs/auth', app, swaggerDoc);

  const port = Number(process.env['AUTH_SERVICE_PORT'] ?? process.env['PORT'] ?? 3001);
  await app.startAllMicroservices();
  await app.listen(port);
}

void bootstrap();
