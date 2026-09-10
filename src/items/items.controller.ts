import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TenantAtual } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { Tenant } from '../tenants/tenant.types';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CATEGORIAS, Categoria, Item } from './item.types';
import { ItemsService } from './items.service';

/**
 * Cardápio pelo lado do lojista. Tudo aqui é autenticado e escopado no tenant
 * que o guard resolveu — a vitrine do cliente final é outra rota
 * (`/public/:slug/items`, sem login).
 */
@Controller('items')
@UseGuards(AuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(
    @TenantAtual() tenant: Tenant,
    @Query('category') category?: string,
  ): Promise<Item[]> {
    if (category && !CATEGORIAS.includes(category as Categoria)) {
      throw new BadRequestException(
        `Categoria inválida. Use uma de: ${CATEGORIAS.join(', ')}.`,
      );
    }
    return this.itemsService.findAll(tenant.id, category as Categoria | undefined);
  }

  @Get(':id')
  findOne(@TenantAtual() tenant: Tenant, @Param('id') id: string): Promise<Item> {
    return this.itemsService.findOne(tenant.id, id);
  }

  @Post()
  create(
    @TenantAtual() tenant: Tenant,
    @Body() dto: CreateItemDto,
  ): Promise<Item> {
    return this.itemsService.create(tenant.id, dto);
  }

  @Put(':id')
  update(
    @TenantAtual() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ): Promise<Item> {
    return this.itemsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@TenantAtual() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.itemsService.remove(tenant.id, id);
  }

  @Patch(':id/toggle')
  @HttpCode(200)
  toggle(@TenantAtual() tenant: Tenant, @Param('id') id: string): Promise<Item> {
    return this.itemsService.toggle(tenant.id, id);
  }
}
