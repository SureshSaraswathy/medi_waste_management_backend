import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { RoleStatus, AccessLevel } from '../../domain/entities/role.domain.entity';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Role name cannot exceed 100 characters.' })
  roleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Role description cannot exceed 500 characters.' })
  roleDescription?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Landing page cannot exceed 100 characters.' })
  landingPage?: string | null;

  @IsEnum(AccessLevel, { message: 'Access level must be one of: Admin, Maker, Checker, Viewer' })
  @IsOptional()
  accessLevel?: AccessLevel | null;

  @IsEnum(RoleStatus, { message: 'Status must be "Active" or "Inactive".' })
  @IsOptional()
  status?: RoleStatus;
}
