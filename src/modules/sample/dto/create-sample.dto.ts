import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateSampleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
