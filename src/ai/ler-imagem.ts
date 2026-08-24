import { BadRequestException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';

import { PASTA_UPLOADS } from '../storage/local-storage.service';

const MIME_POR_EXTENSAO: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export interface ImagemLida {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Lê os bytes de uma imagem a partir da URL devolvida por /upload: caminho
 * local (/uploads/..., modo local) ou URL pública (Supabase Storage).
 */
export async function lerImagem(url: string): Promise<ImagemLida> {
  if (url.startsWith('/uploads/')) {
    const nome = url.replace(/^\/uploads\//, '');
    if (nome.includes('/') || nome.includes('..')) {
      throw new BadRequestException('Caminho de imagem inválido.');
    }

    const buffer = await readFile(join(PASTA_UPLOADS, nome)).catch(() => {
      throw new BadRequestException('Foto não encontrada. Envie a foto de novo.');
    });
    return {
      buffer,
      mimetype: MIME_POR_EXTENSAO[extname(nome).toLowerCase()] ?? 'image/jpeg',
    };
  }

  if (!/^https?:\/\//.test(url)) {
    throw new BadRequestException('URL de imagem inválida.');
  }

  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new BadRequestException('Não foi possível baixar a foto para processar.');
  }

  const buffer = Buffer.from(await resposta.arrayBuffer());
  const mimetype = resposta.headers.get('content-type') ?? 'image/jpeg';
  return { buffer, mimetype };
}
