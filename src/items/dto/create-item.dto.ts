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

  // Nome de uma categoria da loja. O ItemsService confere que ela existe pro
  // tenant antes de gravar (não há mais lista fixa).
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'Escolha uma categoria.' })
  @MaxLength(40)
  category: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || null)
  imageUrl: string | null = null;

  @IsOptional()
  @IsBoolean()
  available: boolean = true;
}
