import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

import { falhaSupabase } from '../supabase/erro';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant, TenantRow, paraTenant } from './tenant.types';

const TABELA = 'tenants';
const COLUNAS =
  'id, slug, name, tagline, logo_url, brand_color, whatsapp, wifi, ' +
  'delivery_fee, min_order, accepts_delivery, accepts_pickup, active, created_at';

@Injectable()
export class TenantsService {
  private readonly db: SupabaseClient;
  private readonly logger = new Logger(TenantsService.name);

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

    if (error) falhaSupabase(this.logger, 'porSlug', error);
    if (!data) throw new NotFoundException('Cardápio não encontrado.');

    return paraTenant(data as unknown as TenantRow);
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

    if (error) falhaSupabase(this.logger, 'doUsuario', error);

    return ((data ?? []) as unknown as { tenants: TenantRow }[])
      .map((linha) => paraTenant(linha.tenants))
      .filter((t) => t.active)
      // Ordem fixa: sem isso o Postgres pode devolver os estabelecimentos em
      // ordens diferentes entre requisições, e o guard — que pega o primeiro
      // quando não vem X-Tenant-Id — resolveria uma loja no /me e outra no
      // /items da mesma tela.
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }

  /**
   * Edição das configurações da própria loja pelo lojista. O tenantId vem do
   * guard (resolvido pelo token), nunca do corpo — o admin só altera a loja que
   * ele administra. Slug e active ficam de fora de propósito: trocar o slug
   * quebra o link impresso na mesa, e desativar a loja é operação nossa.
   */
  async atualizar(tenantId: string, dto: UpdateTenantDto): Promise<Tenant> {
    const linha: Record<string, unknown> = {};
    if (dto.name !== undefined) linha.name = dto.name;
    if (dto.tagline !== undefined) linha.tagline = dto.tagline;
    if (dto.brandColor !== undefined) linha.brand_color = dto.brandColor;
    if (dto.whatsapp !== undefined) linha.whatsapp = dto.whatsapp;
    if (dto.wifi !== undefined) linha.wifi = dto.wifi;
    if (dto.deliveryFee !== undefined) linha.delivery_fee = dto.deliveryFee;
    if (dto.minOrder !== undefined) linha.min_order = dto.minOrder;
    if (dto.acceptsDelivery !== undefined) linha.accepts_delivery = dto.acceptsDelivery;
    if (dto.acceptsPickup !== undefined) linha.accepts_pickup = dto.acceptsPickup;

    const { data, error } = await this.db
      .from(TABELA)
      .update(linha)
      .eq('id', tenantId)
      .select(COLUNAS)
      .maybeSingle();

    if (error) falhaSupabase(this.logger, 'atualizar', error);
    if (!data) throw new NotFoundException('Estabelecimento não encontrado.');

    return paraTenant(data as unknown as TenantRow);
  }
}
