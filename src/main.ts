import multipart from '@fastify/multipart';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { anonKey, exigirSupabase, geminiConfigurado, tenantPadrao } from './config';

const PORTA = Number(process.env.PORT ?? 3000);
const LIMITE_UPLOAD = 5 * 1024 * 1024;

async function bootstrap(): Promise<void> {
  // Antes de subir: sem Supabase não existe banco, storage nem login, e uma
  // API que sobe pela metade só descobre isso na primeira chamada do cliente.
  exigirSupabase();

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

  await app.listen(PORTA, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API em http://localhost:${PORTA}`);
  logger.log(`Supabase: ${process.env.SUPABASE_URL}`);
  logger.log(
    anonKey()
      ? `Tenant padrão: ${tenantPadrao() ?? '(nenhum — "/" vai pedir o slug)'}`
      : 'SUPABASE_ANON_KEY não definida — o admin não consegue fazer login',
  );
  logger.log(
    geminiConfigurado()
      ? 'IA (melhorar foto / gerar descrição): habilitada'
      : 'IA (melhorar foto / gerar descrição): desabilitada — defina GEMINI_API_KEY pra habilitar',
  );
}

void bootstrap();
