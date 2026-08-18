import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Categoria, Item } from './item.types';

/**
 * Contrato de persistência dos itens.
 *
 * Usado como token de DI: em produção resolve pro Supabase; sem credenciais
 * configuradas, cai no repositório local (ver app.module.ts).
 */
export abstract class ItemsRepository {
  abstract findAll(category?: Categoria): Promise<Item[]>;
  abstract findById(id: string): Promise<Item | null>;
  abstract create(data: CreateItemDto): Promise<Item>;
  abstract update(id: string, data: UpdateItemDto): Promise<Item | null>;
  abstract remove(id: string): Promise<boolean>;
}
