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
import { ComplianceRegisterService } from '../compliance-register.service';
import { CreateComplianceRegisterDto } from '../application/dto/create-compliance-register.dto';
import { UpdateComplianceRegisterDto } from '../application/dto/update-compliance-register.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceRegisterController {
  constructor(private readonly complianceRegisterService: ComplianceRegisterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateComplianceRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.complianceRegisterService.create(createDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('authority') authority?: string,
    @Query('complianceType') complianceType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('showExpired') showExpired?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (authority) filters.authority = authority;
    if (complianceType) filters.complianceType = complianceType;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (showExpired === 'true') filters.showExpired = true;
    if (search) filters.search = search;

    return this.complianceRegisterService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complianceRegisterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateComplianceRegisterDto) {
    // TODO: Extract userId from JWT token
    return this.complianceRegisterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.complianceRegisterService.remove(id);
  }
}
