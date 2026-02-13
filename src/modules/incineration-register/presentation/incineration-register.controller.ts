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
import { IncinerationRegisterService } from '../incineration-register.service';
import { CreateIncinerationRegisterDto } from '../application/dto/create-incineration-register.dto';
import { UpdateIncinerationRegisterDto } from '../application/dto/update-incineration-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('incineration-registers')
@UseGuards(JwtAuthGuard)
export class IncinerationRegisterController {
  constructor(private readonly incinerationRegisterService: IncinerationRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateIncinerationRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.incinerationRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.incinerationRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incinerationRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateIncinerationRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.incinerationRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.incinerationRegisterService.remove(id);
  }
}
