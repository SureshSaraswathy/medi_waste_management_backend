import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  categoryCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  categoryName: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
