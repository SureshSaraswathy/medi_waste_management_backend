import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, { message: 'Company code must be uppercase alphanumeric' })
  companyCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;
}
