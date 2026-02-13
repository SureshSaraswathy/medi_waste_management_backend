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
import { IncidentRegisterService } from '../incident-register.service';
import { CreateIncidentRegisterDto } from '../application/dto/create-incident-register.dto';
import { UpdateIncidentRegisterDto } from '../application/dto/update-incident-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('incident-registers')
@UseGuards(JwtAuthGuard)
export class IncidentRegisterController {
  constructor(private readonly incidentRegisterService: IncidentRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateIncidentRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.incidentRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.incidentRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateIncidentRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.incidentRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.incidentRegisterService.remove(id);
  }
}
