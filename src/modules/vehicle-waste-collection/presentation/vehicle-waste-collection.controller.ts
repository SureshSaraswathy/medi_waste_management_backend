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
import { CreateVehicleWasteCollectionDto } from '../application/dto/create-vehicle-waste-collection.dto';
import { UpdateVehicleWasteCollectionDto } from '../application/dto/update-vehicle-waste-collection.dto';
import { VehicleWasteCollectionResponseDto } from '../application/dto/vehicle-waste-collection-response.dto';
import { CreateVehicleWasteCollectionUseCase } from '../application/use-cases/create-vehicle-waste-collection.use-case';
import { GetVehicleWasteCollectionUseCase } from '../application/use-cases/get-vehicle-waste-collection.use-case';
import { GetAllVehicleWasteCollectionsUseCase } from '../application/use-cases/get-all-vehicle-waste-collections.use-case';
import { UpdateVehicleWasteCollectionUseCase } from '../application/use-cases/update-vehicle-waste-collection.use-case';
import { SubmitVehicleWasteCollectionUseCase } from '../application/use-cases/submit-vehicle-waste-collection.use-case';
import { VerifyVehicleWasteCollectionUseCase } from '../application/use-cases/verify-vehicle-waste-collection.use-case';
import { DeleteVehicleWasteCollectionUseCase } from '../application/use-cases/delete-vehicle-waste-collection.use-case';

@Controller('vehicle-waste-collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VehicleWasteCollectionController {
  constructor(
    private readonly createVehicleWasteCollectionUseCase: CreateVehicleWasteCollectionUseCase,
    private readonly getVehicleWasteCollectionUseCase: GetVehicleWasteCollectionUseCase,
    private readonly getAllVehicleWasteCollectionsUseCase: GetAllVehicleWasteCollectionsUseCase,
    private readonly updateVehicleWasteCollectionUseCase: UpdateVehicleWasteCollectionUseCase,
    private readonly submitVehicleWasteCollectionUseCase: SubmitVehicleWasteCollectionUseCase,
    private readonly verifyVehicleWasteCollectionUseCase: VerifyVehicleWasteCollectionUseCase,
    private readonly deleteVehicleWasteCollectionUseCase: DeleteVehicleWasteCollectionUseCase,
  ) {}

  @Post()
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_CREATE')
  async create(
    @Body() createVehicleWasteCollectionDto: CreateVehicleWasteCollectionDto,
    @Request() req: any,
  ) {
    const transaction = await this.createVehicleWasteCollectionUseCase.execute(
      createVehicleWasteCollectionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(transaction),
      message: 'Vehicle waste collection created successfully',
    };
  }

  @Get()
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_VIEW')
  async findAll(
    @Query('vehicleId') vehicleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    try {
      const collections = await this.getAllVehicleWasteCollectionsUseCase.execute(
        vehicleId,
        startDate,
        endDate,
        status,
      );
      return {
        success: true,
        data: collections.map((c) => this.toResponseDto(c)),
        message: 'Vehicle waste collections retrieved successfully',
      };
    } catch (error) {
      console.error('Error in findAll vehicle waste collections:', error);
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_VIEW')
  async findOne(@Param('id') id: string) {
    const collection = await this.getVehicleWasteCollectionUseCase.execute(id);
    return {
      success: true,
      data: this.toResponseDto(collection),
      message: 'Vehicle waste collection retrieved successfully',
    };
  }

  @Put(':id')
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_EDIT')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleWasteCollectionDto: UpdateVehicleWasteCollectionDto,
    @Request() req: any,
  ) {
    const collection = await this.updateVehicleWasteCollectionUseCase.execute(
      id,
      updateVehicleWasteCollectionDto,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(collection),
      message: 'Vehicle waste collection updated successfully',
    };
  }

  @Put(':id/submit')
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_EDIT')
  async submit(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const collection = await this.submitVehicleWasteCollectionUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(collection),
      message: 'Vehicle waste collection submitted successfully',
    };
  }

  @Put(':id/verify')
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_VERIFY')
  async verify(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const collection = await this.verifyVehicleWasteCollectionUseCase.execute(
      id,
      req.user?.userId,
    );
    return {
      success: true,
      data: this.toResponseDto(collection),
      message: 'Vehicle waste collection verified successfully',
    };
  }

  @Delete(':id')
  @RequirePermissions('VEHICLE_WASTE_COLLECTION_DELETE')
  async remove(@Param('id') id: string) {
    await this.deleteVehicleWasteCollectionUseCase.execute(id);
    return {
      success: true,
      message: 'Vehicle waste collection deleted successfully',
    };
  }

  private toResponseDto(collection: any): VehicleWasteCollectionResponseDto {
    // Handle collectionDate - it might be a Date object or a string from PostgreSQL
    let collectionDateStr: string;
    if (collection.collectionDate instanceof Date) {
      collectionDateStr = collection.collectionDate.toISOString().split('T')[0];
    } else if (typeof collection.collectionDate === 'string') {
      // If it's already a string, use it directly (PostgreSQL date format is YYYY-MM-DD)
      collectionDateStr = collection.collectionDate.split('T')[0];
    } else {
      // Fallback: try to parse it
      collectionDateStr = new Date(collection.collectionDate).toISOString().split('T')[0];
    }

    // Handle createdOn
    let createdOnStr: string;
    if (collection.createdOn instanceof Date) {
      createdOnStr = collection.createdOn.toISOString();
    } else if (typeof collection.createdOn === 'string') {
      createdOnStr = collection.createdOn;
    } else {
      createdOnStr = new Date(collection.createdOn).toISOString();
    }

    // Handle modifiedOn
    let modifiedOnStr: string | undefined;
    if (collection.modifiedOn) {
      if (collection.modifiedOn instanceof Date) {
        modifiedOnStr = collection.modifiedOn.toISOString();
      } else if (typeof collection.modifiedOn === 'string') {
        modifiedOnStr = collection.modifiedOn;
      } else {
        modifiedOnStr = new Date(collection.modifiedOn).toISOString();
      }
    }

    // Handle verifiedOn
    let verifiedOnStr: string | undefined;
    if (collection.verifiedOn) {
      if (collection.verifiedOn instanceof Date) {
        verifiedOnStr = collection.verifiedOn.toISOString();
      } else if (typeof collection.verifiedOn === 'string') {
        verifiedOnStr = collection.verifiedOn;
      } else {
        verifiedOnStr = new Date(collection.verifiedOn).toISOString();
      }
    }

    return {
      id: collection.vehicleWasteCollectionId,
      vehicleId: collection.vehicleId,
      collectionDate: collectionDateStr,
      grossWeightKg: collection.grossWeightKg,
      tareWeightKg: collection.tareWeightKg,
      netWeightKg: collection.netWeightKg,
      incinerationWeightKg: collection.incinerationWeightKg,
      autoclaveWeightKg: collection.autoclaveWeightKg,
      vehicleKm: collection.vehicleKm,
      fuelUsageLiters: collection.fuelUsageLiters,
      status: collection.status,
      notes: collection.notes,
      createdBy: collection.createdBy,
      createdOn: createdOnStr,
      modifiedBy: collection.modifiedBy,
      modifiedOn: modifiedOnStr,
      verifiedBy: collection.verifiedBy,
      verifiedOn: verifiedOnStr,
    };
  }
}
