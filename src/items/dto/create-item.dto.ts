import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CATEGORIAS, Categoria } from '../item.types';

export class CreateItemDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'O nome é obrigatório.' })
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : null))
  description: string | null = null;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço inválido.' })
  @IsPositive({ message: 'O preço deve ser maior que zero.' })
  price: number;

  // Categoria livre deixa entrar typo ("Bebida"), que grava no banco e depois
  // não aparece em seção nenhuma da vitrine — item invisível sem erro.
  @IsIn(CATEGORIAS, { message: 'Categoria inválida.' })
  category: Categoria;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || null)
  imageUrl: string | null = null;

  @IsOptional()
  @IsBoolean()
  available: boolean = true;
}
