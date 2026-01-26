import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { WasteProcessNotFoundException, InvalidStatusTransitionException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class SubmitWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    wasteProcessId: string,
    modifiedBy?: string,
  ): Promise<WasteProcess> {
    const wasteProcess = await this.wasteProcessRepository.findById(
      wasteProcessId,
    );
    if (!wasteProcess) {
      throw new WasteProcessNotFoundException(wasteProcessId);
    }

    try {
      const submitted = wasteProcess.submit(modifiedBy || null);
      return this.wasteProcessRepository.update(submitted);
    } catch (error) {
      throw new InvalidStatusTransitionException(wasteProcess.status, 'submit');
    }
  }
}
