import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { TenantAtual } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { Tenant } from '../tenants/tenant.types';
import { CategoriesService } from './categories.service';
import { Category } from './category.types';
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

/** Gestão das categorias da própria loja. Tudo autenticado e escopado no tenant. */
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@TenantAtual() tenant: Tenant): Promise<Category[]> {
    return this.categories.doTenant(tenant.id);
  }

  @Post()
  create(
    @TenantAtual() tenant: Tenant,
    @Body() dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categories.criar(tenant.id, dto);
  }

  // Reordenação antes de :id pra não colidir com a rota de renomear.
  @Put('reorder')
  reorder(
    @TenantAtual() tenant: Tenant,
    @Body() dto: ReorderCategoriesDto,
  ): Promise<Category[]> {
    return this.categories.reordenar(tenant.id, dto);
  }

  @Put(':id')
  rename(
    @TenantAtual() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categories.renomear(tenant.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@TenantAtual() tenant: Tenant, @Param('id') id: string): Promise<void> {
    return this.categories.remover(tenant.id, id);
  }
}
