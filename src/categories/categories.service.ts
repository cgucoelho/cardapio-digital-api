import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

import { falhaSupabase } from '../supabase/erro';
import { SupabaseService } from '../supabase/supabase.service';
import { TenantsService } from '../tenants/tenants.service';
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { Category, CategoryRow, paraCategory } from './category.types';

const TABELA = 'categories';
const COLUNAS = 'id, name, sort_order';

@Injectable()
export class CategoriesService {
  private readonly db: SupabaseClient;
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    supabase: SupabaseService,
    private readonly tenants: TenantsService,
  ) {
    this.db = supabase.client;
  }

  async doTenant(tenantId: string): Promise<Category[]> {
    const { data, error } = await this.db
      .from(TABELA)
      .select(COLUNAS)
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) falhaSupabase(this.logger, 'doTenant', error);
    return (data as CategoryRow[]).map(paraCategory);
  }

  /** Vitrine: categorias da loja ativa, sem login. */
  async porSlug(slug: string): Promise<Category[]> {
    const tenant = await this.tenants.porSlug(slug);
    return this.doTenant(tenant.id);
  }

  /** Nomes válidos pra validar o category de um item. */
  async nomes(tenantId: string): Promise<Set<string>> {
    const cats = await this.doTenant(tenantId);
    return new Set(cats.map((c) => c.name));
  }

  async criar(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    // Nova categoria entra no fim da ordem atual.
    const atuais = await this.doTenant(tenantId);
    const proxima = atuais.reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1;

    const { data, error } = await this.db
      .from(TABELA)
      .insert({ tenant_id: tenantId, name: dto.name, sort_order: proxima })
      .select(COLUNAS)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }
      falhaSupabase(this.logger, 'criar', error);
    }
    return paraCategory(data as CategoryRow);
  }

  async renomear(
    tenantId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const atual = await this.buscar(tenantId, id);
    if (atual.name === dto.name) return atual;

    const { data, error } = await this.db
      .from(TABELA)
      .update({ name: dto.name })
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select(COLUNAS)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Já existe uma categoria com esse nome.');
      }
      falhaSupabase(this.logger, 'renomear', error);
    }

    // items guarda o NOME da categoria; renomear tem que arrastar os itens
    // junto, senão eles somem da vitrine (nome não bate com categoria nenhuma).
    const { error: erroItens } = await this.db
      .from('items')
      .update({ category: dto.name })
      .eq('tenant_id', tenantId)
      .eq('category', atual.name);

    if (erroItens) falhaSupabase(this.logger, 'renomear/itens', erroItens);

    return paraCategory(data as CategoryRow);
  }

  /** Bloqueia a exclusão se houver item na categoria (decisão do produto). */
  async remover(tenantId: string, id: string): Promise<void> {
    const cat = await this.buscar(tenantId, id);

    const { count, error } = await this.db
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('category', cat.name);

    if (error) falhaSupabase(this.logger, 'remover/contagem', error);
    if (count && count > 0) {
      throw new BadRequestException(
        `A categoria "${cat.name}" tem ${count} item(ns). Mova ou remova os itens antes de excluí-la.`,
      );
    }

    const { error: erroDel } = await this.db
      .from(TABELA)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);

    if (erroDel) falhaSupabase(this.logger, 'remover', erroDel);
  }

  /** Recebe todos os ids na ordem desejada e regrava sort_order. */
  async reordenar(tenantId: string, dto: ReorderCategoriesDto): Promise<Category[]> {
    const atuais = await this.doTenant(tenantId);
    const meus = new Set(atuais.map((c) => c.id));

    // Só aceita se a lista for exatamente o conjunto atual — evita mandar id de
    // outra loja ou lista incompleta que zeraria a ordem de quem ficou de fora.
    if (dto.ids.length !== atuais.length || dto.ids.some((id) => !meus.has(id))) {
      throw new BadRequestException('Lista de ordenação inválida.');
    }

    for (let i = 0; i < dto.ids.length; i++) {
      const { error } = await this.db
        .from(TABELA)
        .update({ sort_order: i + 1 })
        .eq('tenant_id', tenantId)
        .eq('id', dto.ids[i]);
      if (error) falhaSupabase(this.logger, 'reordenar', error);
    }
    return this.doTenant(tenantId);
  }

  private async buscar(tenantId: string, id: string): Promise<Category> {
    const { data, error } = await this.db
      .from(TABELA)
      .select(COLUNAS)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error) falhaSupabase(this.logger, 'buscar', error);
    if (!data) throw new NotFoundException('Categoria não encontrada.');
    return paraCategory(data as CategoryRow);
  }
}
