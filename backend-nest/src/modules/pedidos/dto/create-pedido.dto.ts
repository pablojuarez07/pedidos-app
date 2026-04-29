import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CrearPedidoDto {
  @IsString()
  product_name!: string;

  @IsString()
  nombre_comprador!: string;

  @IsString()
  telefono!: string;

  @Type(() => Number)
  @IsNumber()
  producto_id!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cantidad!: number;

  @Type(() => Number)
  @IsNumber()
  precio_unitario!: number;

  @IsString()
  client_id!: string;

  @IsString()
  tipo_pago!: string;

  @IsOptional()
  @IsBoolean()
  pagado?: boolean;

  @IsOptional()
  @IsString()
  payment_id?: string;
}
