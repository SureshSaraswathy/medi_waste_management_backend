import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { UpdateWasteProcessDto } from '../dto/update-waste-process.dto';
import { WasteProcessNotFoundException, InvalidWeightException, InvalidStatusTransitionException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class UpdateWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    wasteProcessId: string,
    updateDto: UpdateWasteProcessDto,
    modifiedBy?: string,
  ): Promise<WasteProcess> {
    const wasteProcess = await this.wasteProcessRepository.findById(
      wasteProcessId,
    );
    if (!wasteProcess) {
      throw new WasteProcessNotFoundException(wasteProcessId);
    }

    // Only draft processes can be updated
    if (wasteProcess.status !== 'Draft') {
      throw new InvalidStatusTransitionException(
        wasteProcess.status,
        'update',
      );
    }

    // Validate weights if provided
    const incinerationWeight = updateDto.incinerationWeightKg ?? wasteProcess.incinerationWeightKg;
    const autoclaveWeight = updateDto.autoclaveWeightKg ?? wasteProcess.autoclaveWeightKg;

    if (incinerationWeight <= 0) {
      throw new InvalidWeightException('Incineration weight must be greater than zero');
    }
    if (autoclaveWeight <= 0) {
      throw new InvalidWeightException('Autoclave weight must be greater than zero');
    }

    const updated = wasteProcess.update({
      incinerationWeightKg: updateDto.incinerationWeightKg,
      autoclaveWeightKg: updateDto.autoclaveWeightKg,
      notes: updateDto.notes,
      modifiedBy,
    });

    return this.wasteProcessRepository.update(updated);
  }
}
