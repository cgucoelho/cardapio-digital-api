import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { ArquivoEnviado, StorageService, nomeSeguro } from './storage.service';

export const PASTA_UPLOADS = join(process.cwd(), 'uploads');

/**
 * Grava a foto em disco e serve por /uploads — fallback do Supabase Storage
 * enquanto a demo roda sem credenciais.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  async upload(arquivo: ArquivoEnviado): Promise<string> {
    const nome = nomeSeguro(arquivo.filename);
    await mkdir(PASTA_UPLOADS, { recursive: true });
    await writeFile(join(PASTA_UPLOADS, nome), arquivo.buffer);
    // URL relativa: funciona tanto pelo proxy do Angular quanto direto na API.
    return `/uploads/${nome}`;
  }
}
