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

@Controller('shredder-registers')
@UseGuards(JwtAuthGuard)
export class ShredderRegisterController {
  constructor(private readonly shredderRegisterService: ShredderRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateShredderRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.shredderRegisterService.create(createDto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.shredderRegisterService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shredderRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateShredderRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.shredderRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.shredderRegisterService.remove(id);
  }
}
