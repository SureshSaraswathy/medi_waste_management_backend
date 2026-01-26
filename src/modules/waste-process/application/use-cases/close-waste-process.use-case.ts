import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { WasteProcessNotFoundException, InvalidStatusTransitionException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class CloseWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    wasteProcessId: string,
    closedBy: string,
  ): Promise<WasteProcess> {
    const wasteProcess = await this.wasteProcessRepository.findById(
      wasteProcessId,
    );
    if (!wasteProcess) {
      throw new WasteProcessNotFoundException(wasteProcessId);
    }

    try {
      const closed = wasteProcess.close(closedBy);
      return this.wasteProcessRepository.update(closed);
    } catch (error) {
      throw new InvalidStatusTransitionException(wasteProcess.status, 'close');
    }
  }
}
