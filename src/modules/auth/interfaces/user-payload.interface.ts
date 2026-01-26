export interface UserPayload {
  userId: string;
  companyId: string;
  userName: string;
  permissions: string[];
  roleId?: string;
}
