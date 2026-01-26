import { IsString, IsNotEmpty, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRouteHcfDto {
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsUUID()
  @IsNotEmpty()
  hcfId: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sequenceOrder?: number;
}
