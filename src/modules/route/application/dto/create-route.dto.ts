import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  routeCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  routeName: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsUUID()
  @IsOptional()
  frequencyId?: string;
}
