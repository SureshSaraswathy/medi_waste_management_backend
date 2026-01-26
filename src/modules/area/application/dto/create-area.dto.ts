import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  areaCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  areaName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  areaPincode: string;
}
