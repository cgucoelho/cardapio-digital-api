import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseService } from '../supabase/supabase.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Categoria, Item } from './item.types';

const TABELA = 'items';

/** Linha crua da tabela public.items. */
interface ItemRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: Categoria;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

/**
 * Persistência dos itens no Supabase.
 *
 * ⚠️ `tenantId` é o primeiro parâmetro de TODO método, inclusive os que já
 * recebem o id do item. Buscar só por id parece bastar — o id é um uuid — mas
 * bastaria um id vazado pra um cliente editar ou apagar o item do outro. A
 * API roda com a service_role, que ignora a RLS: aqui não existe rede de
 * segurança embaixo, o filtro é este.
 */
@Injectable()
export class ItemsRepository {
  private readonly db: SupabaseClient;

  constructor(supabase: SupabaseService) {
    this.db = supabase.client;
  }

  async findAll(tenantId: string, category?: Categoria): Promise<Item[]> {
    let query = this.db
      .from(TABELA)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return (data as ItemRow[]).map(paraItem);
  }

  async findById(tenantId: string, id: string): Promise<Item | null> {
    const { data, error } = await this.db
      .from(TABELA)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return data ? paraItem(data as ItemRow) : null;
  }

  async create(tenantId: string, dto: CreateItemDto): Promise<Item> {
    const { data, error } = await this.db
      .from(TABELA)
      .insert({ ...paraLinha(dto), tenant_id: tenantId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return paraItem(data as ItemRow);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateItemDto,
  ): Promise<Item | null> {
    const { data, error } = await this.db
      .from(TABELA)
      .update(paraLinha(dto))
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return data ? paraItem(data as ItemRow) : null;
  }

  async remove(tenantId: string, id: string): Promise<boolean> {
    const { data, error } = await this.db
      .from(TABELA)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('id');

    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).length > 0;
  }
}

function paraItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    // numeric do Postgres pode chegar como string dependendo do driver.
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    available: row.available,
    createdAt: row.created_at,
  };
}

/** Converte o DTO (camelCase) pras colunas (snake_case), ignorando o que não veio. */
function paraLinha(dto: CreateItemDto | UpdateItemDto): Record<string, unknown> {
  const linha: Record<string, unknown> = {};
  if (dto.name !== undefined) linha.name = dto.name;
  if (dto.description !== undefined) linha.description = dto.description;
  if (dto.price !== undefined) linha.price = dto.price;
  if (dto.category !== undefined) linha.category = dto.category;
  if (dto.imageUrl !== undefined) linha.image_url = dto.imageUrl;
  if (dto.available !== undefined) linha.available = dto.available;
  return linha;
}
