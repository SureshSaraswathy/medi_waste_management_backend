import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { CreateRoleUseCase } from '../application/use-cases/create-role.use-case';
import { GetRoleUseCase } from '../application/use-cases/get-role.use-case';
import { GetAllRolesUseCase } from '../application/use-cases/get-all-roles.use-case';
import { UpdateRoleUseCase } from '../application/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../application/use-cases/delete-role.use-case';
import { CreateRoleDto } from '../application/dto/create-role.dto';
import { UpdateRoleDto } from '../application/dto/update-role.dto';
import { RoleResponseDto } from '../application/dto/role-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ROLE_CREATE')
  async create(@Body() createRoleDto: CreateRoleDto, @Request() req: any) {
    const role = await this.createRoleUseCase.execute(
      createRoleDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(role),
      message: 'Role created successfully',
    };
  }

  @Get()
  @RequirePermissions('ROLE_VIEW')
  async findAll(@Query('companyId') companyId?: string, @Query('activeOnly') activeOnly?: string) {
    const roles = await this.getAllRolesUseCase.execute(companyId, activeOnly === 'true');
    return {
      success: true,
      data: roles.map((r) => this.toResponseDto(r)),
      message: 'Roles retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('ROLE_VIEW')
  async findOne(@Param('id') id: string) {
    const role = await this.getRoleUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(role),
      message: 'Role retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('ROLE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: any,
  ) {
    const role = await this.updateRoleUseCase.execute(
      id,
      updateRoleDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(role),
      message: 'Role updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('ROLE_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteRoleUseCase.execute(id);
  }

  /**
   * Map domain entity to response DTO
   */
  private toResponseDto(role: any): RoleResponseDto {
    return {
      roleId: role.roleId,
      companyId: role.companyId,
      roleName: role.roleName,
      roleDescription: role.roleDescription,
      landingPage: role.landingPage,
      accessLevel: role.accessLevel,
      status: role.status,
      createdBy: role.createdBy,
      createdOn: role.createdOn.toISOString(),
      modifiedBy: role.modifiedBy,
      modifiedOn: role.modifiedOn.toISOString(),
    };
  }
}
