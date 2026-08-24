import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DescribeItemDto {
  @IsString()
  @MinLength(1, { message: 'Informe o nome do item.' })
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
