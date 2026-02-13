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

@Controller('autoclave-registers')
@UseGuards(JwtAuthGuard)
export class AutoclaveRegisterController {
  constructor(private readonly autoclaveRegisterService: AutoclaveRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateAutoclaveRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.autoclaveRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.autoclaveRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.autoclaveRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAutoclaveRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.autoclaveRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.autoclaveRegisterService.remove(id);
  }
}
