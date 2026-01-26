import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, { message: 'State code must be uppercase alphanumeric' })
  stateCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  stateName: string;
}
