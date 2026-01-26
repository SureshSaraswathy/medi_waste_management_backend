import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateFrequencyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  frequencyCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  frequencyName: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
