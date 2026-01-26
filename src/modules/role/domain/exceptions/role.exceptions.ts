import { NotFoundException, ConflictException } from '@nestjs/common';

export class RoleNotFoundException extends NotFoundException {
  constructor(roleId: string) {
    super(`Role with ID ${roleId} not found`);
  }
}

export class DuplicateRoleNameException extends ConflictException {
  constructor(companyId: string, roleName: string) {
    super(`Role with name "${roleName}" already exists for this company`);
  }
}
