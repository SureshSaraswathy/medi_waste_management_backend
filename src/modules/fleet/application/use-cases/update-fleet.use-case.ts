import { Injectable, Inject } from '@nestjs/common';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { Fleet } from '../../domain/entities/fleet.domain.entity';
import { UpdateFleetDto } from '../dto/update-fleet.dto';
import { FleetNotFoundException } from '../../domain/exceptions/fleet.exceptions';

@Injectable()
export class UpdateFleetUseCase {
  constructor(
    @Inject(FLEET_REPOSITORY_TOKEN)
    private readonly fleetRepository: IFleetRepository,
  ) {}

  async execute(fleetId: string, updateFleetDto: UpdateFleetDto, modifiedBy?: string): Promise<Fleet> {
    const fleet = await this.fleetRepository.findById(fleetId);
    if (!fleet) {
      throw new FleetNotFoundException(fleetId);
    }

    fleet.update({
      capacity: updateFleetDto.capacity,
      vehMake: updateFleetDto.vehMake,
      vehModel: updateFleetDto.vehModel,
      mfgYear: updateFleetDto.mfgYear,
      nextFCDate: updateFleetDto.nextFCDate,
      pucDateValidUpto: updateFleetDto.pucDateValidUpto,
      insuranceValidUpto: updateFleetDto.insuranceValidUpto,
      ownerName: updateFleetDto.ownerName,
      ownerContact: updateFleetDto.ownerContact,
      ownerEmail: updateFleetDto.ownerEmail,
      ownerPAN: updateFleetDto.ownerPAN,
      ownerAadhaar: updateFleetDto.ownerAadhaar,
      pymtToName: updateFleetDto.pymtToName,
      pymtBankName: updateFleetDto.pymtBankName,
      pymtAccNum: updateFleetDto.pymtAccNum,
      pymtIFSCode: updateFleetDto.pymtIFSCode,
      pymtBranch: updateFleetDto.pymtBranch,
      contractAmount: updateFleetDto.contractAmount,
      tdsExemption: updateFleetDto.tdsExemption,
      status: updateFleetDto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.fleetRepository.update(fleetId, fleet);
  }
}
