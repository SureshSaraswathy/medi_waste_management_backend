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
import { AutoclaveRegisterService } from '../autoclave-register.service';
import { CreateAutoclaveRegisterDto } from '../application/dto/create-autoclave-register.dto';
import { UpdateAutoclaveRegisterDto } from '../application/dto/update-autoclave-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('autoclave-registers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AutoclaveRegisterController {
  constructor(private readonly autoclaveRegisterService: AutoclaveRegisterService) {}

  @Post()
  @RequirePermissions('AUTOCLAVE_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateAutoclaveRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.autoclaveRegisterService.create(createDto);
  }

  @Get()
  @RequirePermissions('AUTOCLAVE_REGISTER_VIEW')
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.autoclaveRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  @RequirePermissions('AUTOCLAVE_REGISTER_VIEW')
  findOne(@Param('id') id: string) {
    return this.autoclaveRegisterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('AUTOCLAVE_REGISTER_EDIT')
  update(@Param('id') id: string, @Body() updateDto: UpdateAutoclaveRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.autoclaveRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('AUTOCLAVE_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.autoclaveRegisterService.remove(id);
  }
}
