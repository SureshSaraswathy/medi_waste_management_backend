/**
 * DTO for HCF login response
 */
export interface HCFLoginResponse {
  userId: string; // HCF ID
  userName: string; // HCF Code
  email?: string;
  companyId: string;
  userRoleId: string | null;
  userType: 'HCF';
  status: string;
  requiresPasswordChange: boolean;
  passwordExpired: boolean;
  token?: string; // JWT token
}
