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
import { DowntimeRegisterService } from '../downtime-register.service';
import { CreateDowntimeRegisterDto } from '../application/dto/create-downtime-register.dto';
import { UpdateDowntimeRegisterDto } from '../application/dto/update-downtime-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('downtime-registers')
@UseGuards(JwtAuthGuard)
export class DowntimeRegisterController {
  constructor(private readonly downtimeRegisterService: DowntimeRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateDowntimeRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.downtimeRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.downtimeRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.downtimeRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateDowntimeRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.downtimeRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.downtimeRegisterService.remove(id);
  }
}
