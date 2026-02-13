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

@Controller('disposal-registers')
@UseGuards(JwtAuthGuard)
export class DisposalRegisterController {
  constructor(private readonly disposalRegisterService: DisposalRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateDisposalRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.disposalRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.disposalRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disposalRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDisposalRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.disposalRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.disposalRegisterService.remove(id);
  }
}
