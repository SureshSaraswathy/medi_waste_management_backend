import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateHcfTypeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  hcfTypeCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  hcfTypeName: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}
