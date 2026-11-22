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
} from '@nestjs/common';
import { ETPRegisterService } from '../etp-register.service';
import { CreateETPRegisterDto } from '../application/dto/create-etp-register.dto';
import { UpdateETPRegisterDto } from '../application/dto/update-etp-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('etp-registers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ETPRegisterController {
  constructor(private readonly etpRegisterService: ETPRegisterService) {}

  @Post()
  @RequirePermissions('ETP_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateETPRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.etpRegisterService.create(createDto);
  }

  @Get()
  @RequirePermissions('ETP_REGISTER_VIEW')
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.etpRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  @RequirePermissions('ETP_REGISTER_VIEW')
  findOne(@Param('id') id: string) {
    return this.etpRegisterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('ETP_REGISTER_EDIT')
  update(@Param('id') id: string, @Body() updateDto: UpdateETPRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.etpRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('ETP_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.etpRegisterService.remove(id);
  }
}
