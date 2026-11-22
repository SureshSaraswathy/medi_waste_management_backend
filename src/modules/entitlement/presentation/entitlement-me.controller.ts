import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EntitlementService } from '../application/entitlement.service';

/** What the logged-in user's OWN customer has bought. The customer always comes from the JWT. */
@Controller('entitlements')
@UseGuards(JwtAuthGuard)
export class EntitlementMeController {
  constructor(private readonly svc: EntitlementService) {}

  @Get('me')
  async me(@Request() req: any) {
    const user = req.user;
    // SuperAdmin works across customers and is never limited by a customer's plan
    if (this.svc.isPlatformAdmin(user)) {
      const cat = await this.svc.getCatalogue();
      const modes = await this.svc.getModes();
      const all = [...cat.byCode.values()].filter((n) => n.active);
      return {
        success: true,
        data: {
          ...modes, version: 'superadmin', isSuperAdmin: true,
          modules: all.filter((n) => n.type === 'MODULE').map((n) => n.code),
          submodules: all.filter((n) => n.type === 'SUBMODULE').map((n) => n.code),
          features: all.filter((n) => n.type === 'FEATURE').map((n) => n.code),
        },
      };
    }
    return { success: true, data: { ...(await this.svc.effectiveFor(user.companyId)), isSuperAdmin: false } };
  }
}
