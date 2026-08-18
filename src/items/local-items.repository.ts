import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Categoria, Item } from './item.types';
import { ItemsRepository } from './items.repository';
import { ITENS_SEED } from './seed';

const ARQUIVO = join(process.cwd(), '.data', 'items.json');

/**
 * Persistência em arquivo JSON — fallback pra rodar a demo sem Supabase.
 * Mesmo contrato do repositório oficial; some quando as credenciais entram.
 */
@Injectable()
export class LocalItemsRepository extends ItemsRepository implements OnModuleInit {
  private readonly logger = new Logger(LocalItemsRepository.name);
  private itens: Item[] = [];

  async onModuleInit(): Promise<void> {
    if (existsSync(ARQUIVO)) {
      this.itens = JSON.parse(await readFile(ARQUIVO, 'utf8')) as Item[];
      this.logger.log(`${this.itens.length} itens carregados de ${ARQUIVO}`);
      return;
    }

    this.itens = ITENS_SEED.map((base) => ({
      ...base,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }));
    await this.persistir();
    this.logger.log(`Seed inicial gravado com ${this.itens.length} itens`);
  }

  async findAll(category?: Categoria): Promise<Item[]> {
    const lista = category
      ? this.itens.filter((i) => i.category === category)
      : this.itens;
    return lista.map((i) => ({ ...i }));
  }

  async findById(id: string): Promise<Item | null> {
    const item = this.itens.find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  async create(dto: CreateItemDto): Promise<Item> {
    const item: Item = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      category: dto.category,
      imageUrl: dto.imageUrl ?? null,
      available: dto.available ?? true,
      createdAt: new Date().toISOString(),
    };
    this.itens.push(item);
    await this.persistir();
    return { ...item };
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item | null> {
    const atual = this.itens.find((i) => i.id === id);
    if (!atual) return null;

    for (const campo of ['name', 'description', 'price', 'category', 'imageUrl', 'available'] as const) {
      if (dto[campo] !== undefined) (atual as any)[campo] = dto[campo];
    }

    await this.persistir();
    return { ...atual };
  }

  async remove(id: string): Promise<boolean> {
    const antes = this.itens.length;
    this.itens = this.itens.filter((i) => i.id !== id);
    if (this.itens.length === antes) return false;

    await this.persistir();
    return true;
  }

  private async persistir(): Promise<void> {
    await mkdir(dirname(ARQUIVO), { recursive: true });
    await writeFile(ARQUIVO, JSON.stringify(this.itens, null, 2), 'utf8');
  }
}
