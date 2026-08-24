import { Body, Controller, Post } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';
import { DescribeItemDto } from './dto/describe-item.dto';
import { EnhanceImageDto } from './dto/enhance-image.dto';
import { GeminiService, ImagemGerada } from './gemini.service';
import { lerImagem } from './ler-imagem';

@Controller('ai')
export class AiController {
  constructor(
    private readonly gemini: GeminiService,
    private readonly storage: StorageService,
  ) {}

  /** Reprocessa a foto já enviada com IA e devolve a URL da versão melhorada. */
  @Post('enhance-image')
  async enhanceImage(@Body() dto: EnhanceImageDto): Promise<{ url: string }> {
    const original = await lerImagem(dto.imageUrl);
    const melhorada = await this.gemini.melhorarImagem(original);

    const url = await this.storage.upload({
      buffer: melhorada.buffer,
      filename: `melhorada.${extensao(melhorada)}`,
      mimetype: melhorada.mimetype,
    });

    return { url };
  }

  /** Gera uma descrição a partir do nome (e opcionalmente da foto) do item. */
  @Post('describe')
  async describe(@Body() dto: DescribeItemDto): Promise<{ description: string }> {
    const imagem = dto.imageUrl ? await lerImagem(dto.imageUrl) : null;
    const description = await this.gemini.descreverItem(dto.name, imagem);
    return { description };
  }
}

function extensao(imagem: ImagemGerada): string {
  if (imagem.mimetype.includes('png')) return 'png';
  if (imagem.mimetype.includes('webp')) return 'webp';
  return 'jpg';
}
