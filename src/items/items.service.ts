import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Categoria, Item } from './item.types';
import { ItemsRepository } from './items.repository';

@Injectable()
export class ItemsService {
  constructor(private readonly repo: ItemsRepository) {}

  findAll(tenantId: string, category?: Categoria): Promise<Item[]> {
    return this.repo.findAll(tenantId, category);
  }

  async findOne(tenantId: string, id: string): Promise<Item> {
    const item = await this.repo.findById(tenantId, id);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  create(tenantId: string, dto: CreateItemDto): Promise<Item> {
    return this.repo.create(tenantId, dto);
  }

  async update(tenantId: string, id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.repo.update(tenantId, id, dto);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const removido = await this.repo.remove(tenantId, id);
    if (!removido) throw new NotFoundException('Item não encontrado.');
  }

  async toggle(tenantId: string, id: string): Promise<Item> {
    const item = await this.repo.findById(tenantId, id);
    if (!item) throw new NotFoundException('Item não encontrado.');

    return this.update(tenantId, id, { available: !item.available });
  }
}
