import { IsString, IsNotEmpty, MaxLength, MinLength, Matches, IsOptional, IsUUID } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, { message: 'District code must be uppercase alphanumeric' })
  districtCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  districtName: string;

  @IsUUID()
  @IsOptional()
  stateId?: string | null;
}
