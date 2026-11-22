import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EntitlementService } from '../application/entitlement.service';
import { EntitlementAdminGuard } from './entitlement-admin.guard';

/** SuperAdmin-only management API for customer entitlements. */
@Controller('admin/entitlements')
@UseGuards(JwtAuthGuard, EntitlementAdminGuard)
export class EntitlementAdminController {
  constructor(private readonly svc: EntitlementService) {}

  @Get('catalogue')
  async catalogue() {
    return { success: true, data: await this.svc.getCatalogueTree() };
  }

  @Get('companies')
  async companies() {
    return { success: true, data: await this.svc.listCompanies() };
  }

  @Get('companies/:companyId')
  async company(@Param('companyId', new ParseUUIDPipe()) companyId: string) {
    return { success: true, data: await this.svc.getCompanyTree(companyId) };
  }

  /** Save a set of changes atomically. Body: { changes: [{ code, enabled }], expectedVersion?, reason? } */
  @Put('companies/:companyId')
  async save(@Param('companyId', new ParseUUIDPipe()) companyId: string, @Body() body: any, @Request() req: any) {
    const actor = { userId: req.user?.userId || null, userName: req.user?.userName || req.user?.email || null };
    const result = await this.svc.save(companyId, { changes: body?.changes, expectedVersion: body?.expectedVersion, reason: body?.reason }, actor);
    return { success: true, data: result, message: result.changed ? 'Entitlements saved' : 'No changes to save' };
  }

  @Get('companies/:companyId/audit')
  async audit(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('code') code?: string,
    @Query('user') user?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return { success: true, data: await this.svc.getAudit(companyId, { page: Number(page) || 1, pageSize: Number(pageSize) || 50, code, user, from, to }) };
  }

  @Get('mode')
  async mode() {
    return { success: true, data: await this.svc.getModes() };
  }

  /** Body: { mode?, tenantMode? } each OFF | SHADOW | ENFORCE */
  @Put('mode')
  async setMode(@Body() body: any, @Request() req: any) {
    return { success: true, data: await this.svc.setModes({ mode: body?.mode, tenantMode: body?.tenantMode }, req.user?.userId || null), message: 'Rollout mode updated' };
  }

  @Get('shadow-report')
  async shadowReport(@Query('days') days?: string) {
    return { success: true, data: await this.svc.getShadowReport(Number(days) || 14) };
  }
}
