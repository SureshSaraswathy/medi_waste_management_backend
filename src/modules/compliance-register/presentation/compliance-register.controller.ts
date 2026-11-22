import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComplianceRegisterService } from '../compliance-register.service';
import { CreateComplianceRegisterDto } from '../application/dto/create-compliance-register.dto';
import { UpdateComplianceRegisterDto } from '../application/dto/update-compliance-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('compliance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplianceRegisterController {
  constructor(private readonly complianceRegisterService: ComplianceRegisterService) {}

  @Post()
  @RequirePermissions('COMPLIANCE_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateComplianceRegisterDto, @Request() req: any) {
    // the owner is always the caller's customer, taken from the verified JWT (platform admins have no customer)
    const companyId = req.user?.companyId && req.user.companyId !== '00000000-0000-0000-0000-000000000000' ? req.user.companyId : null;
    return this.complianceRegisterService.create(createDto, req.user?.userId, companyId);
  }

  @Get()
  @RequirePermissions('COMPLIANCE_REGISTER_VIEW')
  findAll(
    @Query('status') status?: string,
    @Query('authority') authority?: string,
    @Query('complianceType') complianceType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('showExpired') showExpired?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (authority) filters.authority = authority;
    if (complianceType) filters.complianceType = complianceType;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (showExpired === 'true') filters.showExpired = true;
    if (search) filters.search = search;

    return this.complianceRegisterService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get(':id')
  @RequirePermissions('COMPLIANCE_REGISTER_VIEW')
  findOne(@Param('id') id: string) {
    return this.complianceRegisterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('COMPLIANCE_REGISTER_EDIT')
  update(@Param('id') id: string, @Body() updateDto: UpdateComplianceRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.complianceRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('COMPLIANCE_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.complianceRegisterService.remove(id);
  }
}
