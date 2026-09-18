import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CategoriesService } from '../categories/categories.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './item.types';
import { ItemsRepository } from './items.repository';

@Injectable()
export class ItemsService {
  constructor(
    private readonly repo: ItemsRepository,
    private readonly categories: CategoriesService,
  ) {}

  findAll(tenantId: string, category?: string): Promise<Item[]> {
    return this.repo.findAll(tenantId, category);
  }

  async findOne(tenantId: string, id: string): Promise<Item> {
    const item = await this.repo.findById(tenantId, id);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }

  async create(tenantId: string, dto: CreateItemDto): Promise<Item> {
    await this.exigirCategoria(tenantId, dto.category);
    return this.repo.create(tenantId, dto);
  }

  async update(tenantId: string, id: string, dto: UpdateItemDto): Promise<Item> {
    if (dto.category !== undefined) {
      await this.exigirCategoria(tenantId, dto.category);
    }
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

  /**
   * A categoria do item tem que existir na loja. Sem lista fixa: quem manda é a
   * tabela de categorias do tenant. Barra typo e categoria de outra loja.
   */
  private async exigirCategoria(tenantId: string, nome: string): Promise<void> {
    const nomes = await this.categories.nomes(tenantId);
    if (!nomes.has(nome)) {
      throw new BadRequestException(
        `Categoria "${nome}" não existe nesta loja. Crie a categoria antes.`,
      );
    }
  }
}
