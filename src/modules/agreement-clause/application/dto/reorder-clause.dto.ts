import { IsInt } from 'class-validator';

export class ReorderClauseDto {
  @IsInt()
  newSequenceNo: number;
}
