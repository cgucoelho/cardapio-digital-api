import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { TenantAtual } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { StorageService } from '../storage/storage.service';
import { Tenant } from '../tenants/tenant.types';
import { DescribeItemDto } from './dto/describe-item.dto';
import { EnhanceImageDto } from './dto/enhance-image.dto';
import { GeminiService, ImagemGerada } from './gemini.service';
import { lerImagem } from './ler-imagem';

/**
 * Autenticado não só por causa do dado: cada chamada aqui gasta quota do
 * Gemini da conta, então endpoint aberto é conta esvaziada por qualquer um.
 */
@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(
    private readonly gemini: GeminiService,
    private readonly storage: StorageService,
  ) {}

  /** Reprocessa a foto já enviada com IA e devolve a URL da versão melhorada. */
  @Post('enhance-image')
  async enhanceImage(
    @TenantAtual() tenant: Tenant,
    @Body() dto: EnhanceImageDto,
  ): Promise<{ url: string }> {
    const original = await lerImagem(dto.imageUrl);
    const melhorada = await this.gemini.melhorarImagem(original);

    const url = await this.storage.upload(tenant.id, {
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
