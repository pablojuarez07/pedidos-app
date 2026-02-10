import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @Type(() => Number)
  @IsNumber()
  precio: number;

  @IsString()
  descripcion: string;

  @Type(() => Number)
  @IsNumber()
  stock: number;

  @IsString()
  categoria: string;
}
