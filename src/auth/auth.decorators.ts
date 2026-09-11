import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { RequestAutenticado, UsuarioLogado } from './request.types';
import { Tenant } from '../tenants/tenant.types';

/** Estabelecimento do request, já conferido pelo AuthGuard. */
export const TenantAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): Tenant =>
    contexto.switchToHttp().getRequest<RequestAutenticado>().tenant,
);

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioLogado =>
    contexto.switchToHttp().getRequest<RequestAutenticado>().usuario,
);
