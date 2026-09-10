import { Controller, Get, UseGuards } from '@nestjs/common';

import { Tenant } from '../tenants/tenant.types';
import { TenantsService } from '../tenants/tenants.service';
import { TenantAtual, UsuarioAtual } from './auth.decorators';
import { AuthGuard } from './auth.guard';
import { UsuarioLogado } from './request.types';

interface Sessao {
  usuario: UsuarioLogado;
  /** Estabelecimento em uso nesta requisição. */
  tenant: Tenant;
  /** Todos os que a conta administra — vira seletor no admin quando é mais de um. */
  tenants: Tenant[];
}

/**
 * Primeira chamada do admin depois do login: diz quem entrou e de qual
 * cardápio. Também é o jeito de o front descobrir que a conta existe no
 * Supabase mas ainda não está ligada a nenhum tenant (403 do guard).
 */
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  async sessao(
    @UsuarioAtual() usuario: UsuarioLogado,
    @TenantAtual() tenant: Tenant,
  ): Promise<Sessao> {
    return {
      usuario,
      tenant,
      tenants: await this.tenants.doUsuario(usuario.id),
    };
  }
}
