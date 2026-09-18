import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Todos os campos são opcionais: o PUT aceita atualização parcial. */
export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'O nome é obrigatório.' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : null))
  description?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço inválido.' })
  @IsPositive({ message: 'O preço deve ser maior que zero.' })
  price?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'Escolha uma categoria.' })
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || null)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
