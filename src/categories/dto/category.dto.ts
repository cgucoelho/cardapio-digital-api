import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCategoryDto {
  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'Informe o nome da categoria.' })
  @MaxLength(40)
  name: string;
}

export class UpdateCategoryDto {
  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'Informe o nome da categoria.' })
  @MaxLength(40)
  name: string;
}

/** Reordenação: a lista completa de ids na ordem desejada. */
export class ReorderCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
