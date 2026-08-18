import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CATEGORIAS, Categoria, Item } from './item.types';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@Query('category') category?: string): Promise<Item[]> {
    if (category && !CATEGORIAS.includes(category as Categoria)) {
      throw new BadRequestException(
        `Categoria inválida. Use uma de: ${CATEGORIAS.join(', ')}.`,
      );
    }
    return this.itemsService.findAll(category as Categoria | undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Item> {
    return this.itemsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateItemDto): Promise<Item> {
    return this.itemsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateItemDto): Promise<Item> {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.itemsService.remove(id);
  }
}
