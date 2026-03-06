import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateEquipmentDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  equipmentCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  equipmentName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  equipmentType: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  make?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  capacity?: string | null;
}
