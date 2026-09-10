import { BadRequestException } from '@nestjs/common';

export interface ImagemLida {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Lê os bytes de uma imagem a partir da URL devolvida por /upload — hoje
 * sempre uma URL pública do Supabase Storage. (Até a virada multi-tenant
 * também existia o caminho local /uploads/...; ver histórico do git.)
 */
export async function lerImagem(url: string): Promise<ImagemLida> {
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
