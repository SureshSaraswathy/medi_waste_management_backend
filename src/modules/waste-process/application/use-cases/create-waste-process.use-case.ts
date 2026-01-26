import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { CreateWasteProcessDto } from '../dto/create-waste-process.dto';
import { DuplicateWasteProcessException, InvalidWeightException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class CreateWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    createDto: CreateWasteProcessDto,
    createdBy?: string,
  ): Promise<WasteProcess> {
    // Validate weights are greater than zero
    if (createDto.incinerationWeightKg <= 0) {
      throw new InvalidWeightException('Incineration weight must be greater than zero');
    }
    if (createDto.autoclaveWeightKg <= 0) {
      throw new InvalidWeightException('Autoclave weight must be greater than zero');
    }

    // Check for duplicate company entry on same date
    const processDate = new Date(createDto.processDate);
    const existing = await this.wasteProcessRepository.findByCompanyAndDate(
      createDto.companyId,
      processDate,
    );
    if (existing) {
      throw new DuplicateWasteProcessException(
        createDto.companyId,
        createDto.processDate,
      );
    }

    const wasteProcess = WasteProcess.create({
      wasteProcessId: randomUUID(),
      companyId: createDto.companyId,
      processDate,
      incinerationWeightKg: createDto.incinerationWeightKg,
      autoclaveWeightKg: createDto.autoclaveWeightKg,
      notes: createDto.notes,
      createdBy,
    });

    return this.wasteProcessRepository.create(wasteProcess);
  }
}
