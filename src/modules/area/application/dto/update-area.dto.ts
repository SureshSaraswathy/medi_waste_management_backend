import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

export class UpdateAreaDto {
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  areaPincode?: string;

  @IsEnum(MasterStatus)
  @IsOptional()
  status?: MasterStatus;
}
