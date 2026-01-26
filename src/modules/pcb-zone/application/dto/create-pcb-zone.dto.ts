import { IsString, IsNotEmpty, MaxLength, MinLength, IsEmail, IsOptional } from 'class-validator';

export class CreatePcbZoneDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  pcbZoneName: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  pcbZoneAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactNum?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  alertEmail?: string;
}
