import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseService } from '../supabase/supabase.service';
import { Tenant, TenantRow, paraTenant } from './tenant.types';

const TABELA = 'tenants';
const COLUNAS =
  'id, slug, name, tagline, logo_url, brand_color, whatsapp, wifi, active, created_at';

@Injectable()
export class TenantsService {
  private readonly db: SupabaseClient;

  constructor(supabase: SupabaseService) {
    this.db = supabase.client;
  }

  /** Vitrine: só loja ativa. Loja desativada some da rua, não vira 500. */
  async porSlug(slug: string): Promise<Tenant> {
    const { data, error } = await this.db
      .from(TABELA)
      .select(COLUNAS)
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Cardápio não encontrado.');

    return paraTenant(data as TenantRow);
  }

  /**
   * Estabelecimentos que o usuário administra. É a fonte da verdade do guard:
   * o tenant do request sempre sai desta lista, nunca de algo que o browser
   * mandou — é o que impede um admin de editar o cardápio do vizinho trocando
   * um id no DevTools.
   */
  async doUsuario(userId: string): Promise<Tenant[]> {
    const { data, error } = await this.db
      .from('tenant_users')
      .select(`tenants!inner(${COLUNAS})`)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);

    return ((data ?? []) as unknown as { tenants: TenantRow }[])
      .map((linha) => paraTenant(linha.tenants))
      .filter((t) => t.active)
      // Ordem fixa: sem isso o Postgres pode devolver os estabelecimentos em
      // ordens diferentes entre requisições, e o guard — que pega o primeiro
      // quando não vem X-Tenant-Id — resolveria uma loja no /me e outra no
      // /items da mesma tela.
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }
}
