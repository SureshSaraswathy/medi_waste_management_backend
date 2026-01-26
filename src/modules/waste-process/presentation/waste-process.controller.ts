import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateWasteProcessDto } from '../application/dto/create-waste-process.dto';
import { UpdateWasteProcessDto } from '../application/dto/update-waste-process.dto';
import { WasteProcessResponseDto } from '../application/dto/waste-process-response.dto';
import { CreateWasteProcessUseCase } from '../application/use-cases/create-waste-process.use-case';
import { GetWasteProcessUseCase } from '../application/use-cases/get-waste-process.use-case';
import { GetAllWasteProcessesUseCase } from '../application/use-cases/get-all-waste-processes.use-case';
import { UpdateWasteProcessUseCase } from '../application/use-cases/update-waste-process.use-case';
import { SubmitWasteProcessUseCase } from '../application/use-cases/submit-waste-process.use-case';
import { VerifyWasteProcessUseCase } from '../application/use-cases/verify-waste-process.use-case';
import { CloseWasteProcessUseCase } from '../application/use-cases/close-waste-process.use-case';
import { DeleteWasteProcessUseCase } from '../application/use-cases/delete-waste-process.use-case';

@Controller('waste-processes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WasteProcessController {
  constructor(
    private readonly createWasteProcessUseCase: CreateWasteProcessUseCase,
    private readonly getWasteProcessUseCase: GetWasteProcessUseCase,
    private readonly getAllWasteProcessesUseCase: GetAllWasteProcessesUseCase,
    private readonly updateWasteProcessUseCase: UpdateWasteProcessUseCase,
    private readonly submitWasteProcessUseCase: SubmitWasteProcessUseCase,
    private readonly verifyWasteProcessUseCase: VerifyWasteProcessUseCase,
    private readonly closeWasteProcessUseCase: CloseWasteProcessUseCase,
    private readonly deleteWasteProcessUseCase: DeleteWasteProcessUseCase,
  ) {}

  @Post()
  @RequirePermissions('WASTE_PROCESS_CREATE')
  async create(
    @Body() createWasteProcessDto: CreateWasteProcessDto,
    @Request() req: any,
  ) {
    const process = await this.createWasteProcessUseCase.execute(
      createWasteProcessDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process created successfully',
    };
  }

  @Get()
  @RequirePermissions('WASTE_PROCESS_VIEW')
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    try {
      const processes = await this.getAllWasteProcessesUseCase.execute(
        companyId,
        startDate,
        endDate,
        status,
      );
      return {
        success: true,
        data: processes.map((p) => this.toResponseDto(p)),
        message: 'Waste processes retrieved successfully',
      };
    } catch (error) {
      console.error('Error in findAll waste processes:', error);
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('WASTE_PROCESS_VIEW')
  async findOne(@Param('id') id: string) {
    const process = await this.getWasteProcessUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('WASTE_PROCESS_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateWasteProcessDto: UpdateWasteProcessDto,
    @Request() req: any,
  ) {
    const process = await this.updateWasteProcessUseCase.execute(
      id,
      updateWasteProcessDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process updated successfully',
    };
  }

  @Put(':id/submit')
  @RequirePermissions('WASTE_PROCESS_EDIT')
  async submit(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const process = await this.submitWasteProcessUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process submitted successfully',
    };
  }

  @Put(':id/verify')
  @RequirePermissions('WASTE_PROCESS_VERIFY')
  async verify(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const process = await this.verifyWasteProcessUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process verified successfully',
    };
  }

  @Put(':id/close')
  @RequirePermissions('WASTE_PROCESS_CLOSE')
  async close(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const process = await this.closeWasteProcessUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(process),
      message: 'Waste process closed successfully',
    };
  }

  @Delete(':id')
  @RequirePermissions('WASTE_PROCESS_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteWasteProcessUseCase.execute(id);
    return {
      success: true,
      message: 'Waste process deleted successfully',
    };
  }

  private toResponseDto(process: any): WasteProcessResponseDto {
    // Handle processDate - it might be a Date object or a string from PostgreSQL
    let processDateStr: string;
    if (process.processDate instanceof Date) {
      processDateStr = process.processDate.toISOString().split('T')[0];
    } else if (typeof process.processDate === 'string') {
      processDateStr = process.processDate.split('T')[0];
    } else {
      processDateStr = new Date(process.processDate).toISOString().split('T')[0];
    }

    // Handle createdOn
    let createdOnStr: string;
    if (process.createdOn instanceof Date) {
      createdOnStr = process.createdOn.toISOString();
    } else if (typeof process.createdOn === 'string') {
      createdOnStr = process.createdOn;
    } else {
      createdOnStr = new Date(process.createdOn).toISOString();
    }

    // Handle modifiedOn
    let modifiedOnStr: string | undefined;
    if (process.modifiedOn) {
      if (process.modifiedOn instanceof Date) {
        modifiedOnStr = process.modifiedOn.toISOString();
      } else if (typeof process.modifiedOn === 'string') {
        modifiedOnStr = process.modifiedOn;
      } else {
        modifiedOnStr = new Date(process.modifiedOn).toISOString();
      }
    }

    // Handle verifiedOn
    let verifiedOnStr: string | undefined;
    if (process.verifiedOn) {
      if (process.verifiedOn instanceof Date) {
        verifiedOnStr = process.verifiedOn.toISOString();
      } else if (typeof process.verifiedOn === 'string') {
        verifiedOnStr = process.verifiedOn;
      } else {
        verifiedOnStr = new Date(process.verifiedOn).toISOString();
      }
    }

    // Handle closedOn
    let closedOnStr: string | undefined;
    if (process.closedOn) {
      if (process.closedOn instanceof Date) {
        closedOnStr = process.closedOn.toISOString();
      } else if (typeof process.closedOn === 'string') {
        closedOnStr = process.closedOn;
      } else {
        closedOnStr = new Date(process.closedOn).toISOString();
      }
    }

    return {
      id: process.wasteProcessId,
      companyId: process.companyId,
      processDate: processDateStr,
      incinerationWeightKg: process.incinerationWeightKg,
      autoclaveWeightKg: process.autoclaveWeightKg,
      status: process.status,
      notes: process.notes,
      createdBy: process.createdBy,
      createdOn: createdOnStr,
      modifiedBy: process.modifiedBy,
      modifiedOn: modifiedOnStr,
      verifiedBy: process.verifiedBy,
      verifiedOn: verifiedOnStr,
      closedBy: process.closedBy,
      closedOn: closedOnStr,
    };
  }
}
