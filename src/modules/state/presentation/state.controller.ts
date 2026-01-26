import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { CreateStateUseCase } from '../application/use-cases/create-state.use-case';
import { GetStateUseCase } from '../application/use-cases/get-state.use-case';
import { GetAllStatesUseCase } from '../application/use-cases/get-all-states.use-case';
import { UpdateStateUseCase } from '../application/use-cases/update-state.use-case';
import { DeleteStateUseCase } from '../application/use-cases/delete-state.use-case';
import { CreateStateDto } from '../application/dto/create-state.dto';
import { UpdateStateDto } from '../application/dto/update-state.dto';
import { StateResponseDto } from '../application/dto/state-response.dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditLogInterceptor } from '../../user/presentation/interceptors/audit-log.interceptor';

@Controller('states')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class StateController {
  constructor(
    private readonly createStateUseCase: CreateStateUseCase,
    private readonly getStateUseCase: GetStateUseCase,
    private readonly getAllStatesUseCase: GetAllStatesUseCase,
    private readonly updateStateUseCase: UpdateStateUseCase,
    private readonly deleteStateUseCase: DeleteStateUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('STATE_CREATE')
  async create(@Body() createStateDto: CreateStateDto, @Request() req: any) {
    const state = await this.createStateUseCase.execute(
      createStateDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(state),
      message: 'State created successfully',
    };
  }

  @Get()
  @RequirePermissions('STATE_VIEW')
  async findAll(@Query('activeOnly') activeOnly?: string) {
    const states = await this.getAllStatesUseCase.execute(activeOnly === 'true');
    return {
      success: true,
      data: states.map((s) => this.toResponseDto(s)),
      message: 'States retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions('STATE_VIEW')
  async findOne(@Param('id') id: string) {
    const state = await this.getStateUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(state),
      message: 'State retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('STATE_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateStateDto: UpdateStateDto,
    @Request() req: any,
  ) {
    const state = await this.updateStateUseCase.execute(
      id,
      updateStateDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(state),
      message: 'State updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('STATE_DELETE')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.deleteStateUseCase.execute(id, req.user?.userId);
  }

  private toResponseDto(state: any): StateResponseDto {
    return {
      id: state.stateId,
      stateCode: state.stateCode,
      stateName: state.stateName,
      status: state.status,
      createdBy: state.createdBy,
      createdOn: state.createdOn.toISOString(),
      modifiedBy: state.modifiedBy,
      modifiedOn: state.modifiedOn.toISOString(),
    };
  }
}
