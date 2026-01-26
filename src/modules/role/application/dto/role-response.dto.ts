import { RoleStatus, AccessLevel } from '../../domain/entities/role.domain.entity';

export class RoleResponseDto {
  roleId: string;
  companyId: string;
  roleName: string;
  roleDescription: string | null;
  landingPage: string | null;
  accessLevel: AccessLevel | null;
  status: RoleStatus;
  createdBy: string | null;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string;
}
