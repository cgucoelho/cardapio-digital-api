import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsHexColor,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Todos os campos opcionais: o lojista salva um subconjunto das configurações. */
export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'O nome é obrigatório.' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : null))
  @MaxLength(120)
  tagline?: string | null;

  @IsOptional()
  @IsHexColor({ message: 'Cor inválida.' })
  brandColor?: string;

  // Só dígitos: é o número pro qual o wa.me vai abrir. Deixa o cliente sem link
  // se vier torto, então limpamos aqui e o front valida o formato.
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') || null : null,
  )
  @MaxLength(15)
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : null))
  @MaxLength(60)
  wifi?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Taxa de entrega inválida.' })
  @Min(0, { message: 'A taxa de entrega não pode ser negativa.' })
  deliveryFee?: number;

  // null = sem pedido mínimo.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Pedido mínimo inválido.' })
  @Min(0, { message: 'O pedido mínimo não pode ser negativo.' })
  minOrder?: number | null;

  @IsOptional()
  @IsBoolean()
  acceptsDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsPickup?: boolean;
}
