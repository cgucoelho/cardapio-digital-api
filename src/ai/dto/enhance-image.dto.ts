import { IsString, MinLength } from 'class-validator';

export class EnhanceImageDto {
  @IsString()
  @MinLength(1, { message: 'Informe a URL da foto.' })
  imageUrl: string;
}
