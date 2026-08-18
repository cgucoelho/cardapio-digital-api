import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { mkdirSync } from 'fs';

import { AppModule } from './app.module';
import { modoSupabase } from './config';
import { PASTA_UPLOADS } from './storage/local-storage.service';

const PORTA = Number(process.env.PORT ?? 3000);
const LIMITE_UPLOAD = 5 * 1024 * 1024;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.register(multipart, {
    limits: { fileSize: LIMITE_UPLOAD, files: 1 },
  });

  // Fotos do modo local ficam em disco; no modo Supabase a pasta fica vazia.
  mkdirSync(PASTA_UPLOADS, { recursive: true });
  await app.register(fastifyStatic, {
    root: PASTA_UPLOADS,
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.listen(PORTA, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API em http://localhost:${PORTA}`);
  logger.log(
    modoSupabase()
      ? 'Persistência: Supabase (PostgreSQL + Storage)'
      : 'Persistência: local (.data/items.json + uploads/) — defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY pra usar o Supabase',
  );
}

void bootstrap();
