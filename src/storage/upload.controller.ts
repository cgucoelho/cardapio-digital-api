import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { TenantAtual } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { Tenant } from '../tenants/tenant.types';
import { StorageService } from './storage.service';

@Controller()
@UseGuards(AuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly storage: StorageService) {}

  /** multipart/form-data com um campo "file". Devolve { url }. */
  @Post('upload')
  async upload(
    @Req() req: FastifyRequest,
    @TenantAtual() tenant: Tenant,
  ): Promise<{ url: string }> {
    const arquivo = await req.file();

    if (!arquivo) {
      throw new BadRequestException('Envie a imagem no campo "file".');
    }
    if (!arquivo.mimetype?.startsWith('image/')) {
      throw new BadRequestException('O arquivo precisa ser uma imagem.');
    }

    let buffer: Buffer;
    try {
      buffer = await arquivo.toBuffer();
    } catch (e) {
      // @fastify/multipart estoura aqui quando passa do limite configurado.
      this.logger.warn(`Upload rejeitado: ${(e as Error).message}`);
      throw new BadRequestException('Imagem muito grande (máximo 5 MB).');
    }

    const url = await this.storage.upload(tenant.id, {
      buffer,
      filename: arquivo.filename,
      mimetype: arquivo.mimetype,
    });

    return { url };
  }
}
