import { Body, Controller, Put, UseGuards } from '@nestjs/common';

import { TenantAtual } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './tenant.types';
import { TenantsService } from './tenants.service';

/**
 * Configurações da própria loja pelo lojista. Autenticado; o tenant sai do
 * guard, então não há como editar a loja de outro. Rota separada do /me
 * (que é só leitura da sessão).
 */
@Controller('tenant')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Put()
  atualizar(
    @TenantAtual() tenant: Tenant,
    @Body() dto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenants.atualizar(tenant.id, dto);
  }
}
