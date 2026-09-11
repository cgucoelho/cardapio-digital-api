import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';

import { anonKey, tenantPadrao } from '../config';
import { CATEGORIAS, Categoria, Item } from '../items/item.types';
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

  @Get(':slug/items')
  async itens(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ): Promise<Item[]> {
    if (category && !CATEGORIAS.includes(category as Categoria)) {
      throw new BadRequestException(
        `Categoria inválida. Use uma de: ${CATEGORIAS.join(', ')}.`,
      );
    }

    // porSlug já derruba slug inexistente e loja desativada com 404.
    const tenant = await this.tenants.porSlug(slug);
    return this.items.findAll(tenant.id, category as Categoria | undefined);
  }
}
