import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SupabaseService } from '../supabase/supabase.service';

export interface ArquivoEnviado {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

/**
 * Fotos dos itens no Supabase Storage.
 *
 * Um bucket só, uma pasta por tenant: `menu-items/{tenant_id}/{arquivo}`.
 * Bucket por cliente esbarra no limite do projeto e obriga a criar política
 * nova a cada onboarding; a pasta é o que as policies de storage do
 * schema.sql sabem ler pra decidir quem escreve onde.
 */
@Injectable()
export class StorageService {
  private readonly bucket: string;

  constructor(
    private readonly supabase: SupabaseService,
    config: ConfigService,
  ) {
    this.bucket = config.get<string>('SUPABASE_BUCKET', 'menu-items');
  }

  /** Salva o arquivo na pasta do tenant e devolve a URL pública. */
  async upload(tenantId: string, arquivo: ArquivoEnviado): Promise<string> {
    const caminho = `${tenantId}/${nomeSeguro(arquivo.filename)}`;

    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .upload(caminho, arquivo.buffer, {
        contentType: arquivo.mimetype,
        upsert: false,
      });

    if (error) throw new InternalServerErrorException(error.message);

    const { data } = this.supabase.client.storage
      .from(this.bucket)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }
}

/** Nome de arquivo previsível e seguro: timestamp + slug do original. */
export function nomeSeguro(original: string): string {
  const limpo = original
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-60);
  return `${Date.now()}-${limpo || 'foto.jpg'}`;
}
