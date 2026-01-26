import { IsString, IsNotEmpty, IsUUID, IsDateString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateTrainingCertificateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  certificateNo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  staffName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  staffCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  designation?: string;

  @IsUUID()
  @IsNotEmpty()
  hcfId: string;

  @IsDateString()
  @IsNotEmpty()
  trainingDate: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  trainedBy: string;
}
