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
import { DisposalRegisterService } from '../disposal-register.service';
import { CreateDisposalRegisterDto } from '../application/dto/create-disposal-register.dto';
import { UpdateDisposalRegisterDto } from '../application/dto/update-disposal-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('disposal-registers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DisposalRegisterController {
  constructor(private readonly disposalRegisterService: DisposalRegisterService) {}

  @Post()
  @RequirePermissions('DISPOSAL_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateDisposalRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.disposalRegisterService.create(createDto);
  }

  @Get()
  @RequirePermissions('DISPOSAL_REGISTER_VIEW')
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.disposalRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  @RequirePermissions('DISPOSAL_REGISTER_VIEW')
  findOne(@Param('id') id: string) {
    return this.disposalRegisterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DISPOSAL_REGISTER_EDIT')
  update(@Param('id') id: string, @Body() updateDto: UpdateDisposalRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.disposalRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('DISPOSAL_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.disposalRegisterService.remove(id);
  }
}
