import { FastifyRequest } from 'fastify';

import { Tenant } from '../tenants/tenant.types';

export interface UsuarioLogado {
  id: string;
  email: string | null;
}

/**
 * O que o AuthGuard pendura no request. Todo controller autenticado lê daqui
 * (via @TenantAtual / @UsuarioAtual) em vez de confiar em qualquer coisa que
 * tenha vindo no corpo ou na query.
 */
export interface RequestAutenticado extends FastifyRequest {
  usuario: UsuarioLogado;
  tenant: Tenant;
}
