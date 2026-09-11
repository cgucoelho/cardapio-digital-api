import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { SupabaseService } from '../supabase/supabase.service';
import { TenantsService } from '../tenants/tenants.service';
import { RequestAutenticado } from './request.types';

/** Cabeçalho opcional: só importa pra quem administra mais de um cardápio. */
const CABECALHO_TENANT = 'x-tenant-id';

/**
 * Valida o token do Supabase Auth e resolve o tenant do request.
 *
 * O token vem do browser (o Angular faz login direto no Supabase), então é
 * conferido no servidor a cada chamada — `getUser` bate no Supabase, o que
 * também faz logout e usuário deletado surtirem efeito na hora. É tráfego de
 * admin, baixo volume; vale o round-trip pela simplicidade.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly tenants: TenantsService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<RequestAutenticado>();

    const token = extrairToken(req);
    if (!token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Sessão expirada. Entre de novo.');
    }

    const meus = await this.tenants.doUsuario(data.user.id);
    if (meus.length === 0) {
      throw new ForbiddenException(
        'Sua conta ainda não está ligada a nenhum cardápio.',
      );
    }

    // Sem o cabeçalho, o primeiro (e normalmente único) estabelecimento.
    const pedido = req.headers[CABECALHO_TENANT];
    const tenant =
      typeof pedido === 'string' && pedido
        ? meus.find((t) => t.id === pedido)
        : meus[0];

    if (!tenant) {
      throw new ForbiddenException('Você não administra este cardápio.');
    }

    req.usuario = { id: data.user.id, email: data.user.email ?? null };
    req.tenant = tenant;
    return true;
  }
}

function extrairToken(req: FastifyRequest): string | null {
  const cabecalho = req.headers.authorization;
  if (!cabecalho) return null;

  const [tipo, valor] = cabecalho.split(' ');
  return tipo?.toLowerCase() === 'bearer' && valor ? valor : null;
}
