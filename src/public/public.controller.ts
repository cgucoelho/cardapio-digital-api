import { Controller, Get, Param, Query } from '@nestjs/common';

import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/category.types';
import { anonKey, tenantPadrao } from '../config';
import { Item } from '../items/item.types';
import { ItemsService } from '../items/items.service';
import { Tenant } from '../tenants/tenant.types';
import { TenantsService } from '../tenants/tenants.service';

interface ConfigPublica {
  supabaseUrl: string;
  supabaseAnonKey: string | null;
  tenantPadrao: string | null;
}

/**
 * O que o cliente final (e o Angular antes do login) enxerga. Sem token, sem
 * cabeçalho de tenant: o slug da URL é quem diz de qual cardápio se trata.
 */
@Controller('public')
export class PublicController {
  constructor(
    private readonly tenants: TenantsService,
    private readonly items: ItemsService,
    private readonly categories: CategoriesService,
  ) {}

  /**
   * Configuração que o front precisa em runtime. Vem daqui, e não do build,
   * pelo mesmo motivo que a URL da API não é embutida: uma imagem só, que
   * serve pro dev e pra produção, e trocar de projeto Supabase é editar o
   * `.env` do stack — não rebuildar o Angular.
   */
  @Get('config')
  config(): ConfigPublica {
    return {
      supabaseUrl: process.env.SUPABASE_URL as string,
      supabaseAnonKey: anonKey(),
      tenantPadrao: tenantPadrao(),
    };
  }

  @Get(':slug')
  tenant(@Param('slug') slug: string): Promise<Tenant> {
    return this.tenants.porSlug(slug);
  }

  /** Categorias da loja, na ordem definida pelo lojista — a vitrine monta as seções por aqui. */
  @Get(':slug/categories')
  categorias(@Param('slug') slug: string): Promise<Category[]> {
    return this.categories.porSlug(slug);
  }

  @Get(':slug/items')
  async itens(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ): Promise<Item[]> {
    // porSlug já derruba slug inexistente e loja desativada com 404.
    const tenant = await this.tenants.porSlug(slug);
    // Filtro por categoria é texto livre agora; categoria inexistente só
    // devolve lista vazia, não é erro.
    return this.items.findAll(tenant.id, category || undefined);
  }
}
