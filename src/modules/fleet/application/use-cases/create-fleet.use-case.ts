import { Injectable, Inject } from '@nestjs/common';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { Fleet } from '../../domain/entities/fleet.domain.entity';
import { CreateFleetDto } from '../dto/create-fleet.dto';
import { DuplicateVehicleNumException } from '../../domain/exceptions/fleet.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateFleetUseCase {
  constructor(
    @Inject(FLEET_REPOSITORY_TOKEN)
    private readonly fleetRepository: IFleetRepository,
  ) {}

  async execute(createFleetDto: CreateFleetDto, createdBy?: string): Promise<Fleet> {
    const existing = await this.fleetRepository.findByVehicleNum(
      createFleetDto.vehicleNum,
      createFleetDto.companyId,
    );
    if (existing) {
      throw new DuplicateVehicleNumException(createFleetDto.vehicleNum);
    }

    const fleet = Fleet.create({
      fleetId: randomUUID(),
      vehicleNum: createFleetDto.vehicleNum,
      companyId: createFleetDto.companyId,
      capacity: createFleetDto.capacity,
      vehMake: createFleetDto.vehMake,
      vehModel: createFleetDto.vehModel,
      mfgYear: createFleetDto.mfgYear,
      nextFCDate: createFleetDto.nextFCDate,
      pucDateValidUpto: createFleetDto.pucDateValidUpto,
      insuranceValidUpto: createFleetDto.insuranceValidUpto,
      ownerName: createFleetDto.ownerName,
      ownerContact: createFleetDto.ownerContact,
      ownerEmail: createFleetDto.ownerEmail,
      ownerPAN: createFleetDto.ownerPAN,
      ownerAadhaar: createFleetDto.ownerAadhaar,
      pymtToName: createFleetDto.pymtToName,
      pymtBankName: createFleetDto.pymtBankName,
      pymtAccNum: createFleetDto.pymtAccNum,
      pymtIFSCode: createFleetDto.pymtIFSCode,
      pymtBranch: createFleetDto.pymtBranch,
      contractAmount: createFleetDto.contractAmount,
      tdsExemption: createFleetDto.tdsExemption,
      createdBy: createdBy || null,
    });

    return this.fleetRepository.create(fleet);
  }
}
