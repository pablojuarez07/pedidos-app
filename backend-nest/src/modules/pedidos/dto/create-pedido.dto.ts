import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CrearPedidoDto {
  @IsString()
  nombre_comprador: string;

  @IsString()
  telefono: string;

  @Type(() => Number)
  @IsNumber()
  producto_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cantidad: number;

  @Type(() => Number)
  @IsNumber()
  precio_unitario: number;

  @IsString()
  client_id: string;
}
