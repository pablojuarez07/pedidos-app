// dto/cambiar-estado.dto.ts
import { IsIn } from 'class-validator';

export class CambiarEstadoDto {
  @IsIn(['pendiente', 'cancelado', 'entregado'])
  estado: 'pendiente' | 'cancelado' | 'entregado';
}
