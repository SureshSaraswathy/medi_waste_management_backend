import { IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateFinanceYearDto {
  @IsInt()
  @IsNotEmpty()
  @Min(2000)
  @Max(2100)
  startYear: number; // e.g., 2025
}
