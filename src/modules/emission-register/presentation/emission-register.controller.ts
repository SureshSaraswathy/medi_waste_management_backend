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
import { EmissionRegisterService } from '../emission-register.service';
import { CreateEmissionRegisterDto } from '../application/dto/create-emission-register.dto';
import { UpdateEmissionRegisterDto } from '../application/dto/update-emission-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('emission-registers')
@UseGuards(JwtAuthGuard)
export class EmissionRegisterController {
  constructor(private readonly emissionRegisterService: EmissionRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateEmissionRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.emissionRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.emissionRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emissionRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEmissionRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.emissionRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.emissionRegisterService.remove(id);
  }
}
