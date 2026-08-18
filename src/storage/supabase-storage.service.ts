import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SupabaseService } from '../supabase/supabase.service';
import { ArquivoEnviado, StorageService, nomeSeguro } from './storage.service';

@Injectable()
export class SupabaseStorageService extends StorageService {
  private readonly bucket: string;

  constructor(
    private readonly supabase: SupabaseService,
    config: ConfigService,
  ) {
    super();
    this.bucket = config.get<string>('SUPABASE_BUCKET', 'menu-items');
  }

  async upload(arquivo: ArquivoEnviado): Promise<string> {
    const caminho = nomeSeguro(arquivo.filename);

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
