import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Middleware ──────────────────────────────────────────
  app.use(cookieParser());

  // ── Global Prefix ───────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS ────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // ── Validation ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform payloads to DTO classes
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Exception Filter ────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Swagger / OpenAPI ───────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS Admin Platform API')
    .setDescription('Multi-Tenant SaaS Admin Platform — Phase 1')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ── Listen ──────────────────────────────────────────────
  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`🚀 API running at http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
