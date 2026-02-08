import { IsDateString } from 'class-validator';

export class ChangeCierreDto {
  @IsDateString()
  cierreCampania: string;
}
  