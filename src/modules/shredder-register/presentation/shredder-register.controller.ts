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
import { ShredderRegisterService } from '../shredder-register.service';
import { CreateShredderRegisterDto } from '../application/dto/create-shredder-register.dto';
import { UpdateShredderRegisterDto } from '../application/dto/update-shredder-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('shredder-registers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShredderRegisterController {
  constructor(private readonly shredderRegisterService: ShredderRegisterService) {}

  @Post()
  @RequirePermissions('SHREDDER_REGISTER_CREATE')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateShredderRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.shredderRegisterService.create(createDto);
  }

  @Get()
  @RequirePermissions('SHREDDER_REGISTER_VIEW')
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.shredderRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  @RequirePermissions('SHREDDER_REGISTER_VIEW')
  findOne(@Param('id') id: string) {
    return this.shredderRegisterService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('SHREDDER_REGISTER_EDIT')
  update(@Param('id') id: string, @Body() updateDto: UpdateShredderRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.shredderRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions('SHREDDER_REGISTER_DELETE')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.shredderRegisterService.remove(id);
  }
}
