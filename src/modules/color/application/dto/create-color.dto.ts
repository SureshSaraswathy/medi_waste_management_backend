import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  colorName: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
