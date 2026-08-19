import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Categoria, Item } from './item.types';
import { ItemsRepository } from './items.repository';

@Injectable()
export class ItemsService {
  constructor(private readonly repo: ItemsRepository) {}

  findAll(category?: Categoria): Promise<Item[]> {
    return this.repo.findAll(category);
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  create(dto: CreateItemDto): Promise<Item> {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.repo.update(id, dto);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async remove(id: string): Promise<void> {
    const removido = await this.repo.remove(id);
    if (!removido) throw new NotFoundException('Item não encontrado.');
  }

  async toggle(id: string): Promise<Item> {
  const item = await this.repo.findById(id);

  if (!item) {
    throw new NotFoundException(`Item ${id} não encontrado`);
  }

  await this.repo.update(id, { available: !item.available });

  return { ...item, available: !item.available };
}
}
