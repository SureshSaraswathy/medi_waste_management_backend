import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePlaceholderMasterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  placeholderCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  placeholderDescription: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceTable: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceColumn: string;
}
