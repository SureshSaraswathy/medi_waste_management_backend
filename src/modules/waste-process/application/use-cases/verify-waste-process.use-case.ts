import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { WasteProcessNotFoundException, InvalidStatusTransitionException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class VerifyWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    wasteProcessId: string,
    verifiedBy: string,
  ): Promise<WasteProcess> {
    const wasteProcess = await this.wasteProcessRepository.findById(
      wasteProcessId,
    );
    if (!wasteProcess) {
      throw new WasteProcessNotFoundException(wasteProcessId);
    }

    try {
      const verified = wasteProcess.verify(verifiedBy);
      return this.wasteProcessRepository.update(verified);
    } catch (error) {
      throw new InvalidStatusTransitionException(wasteProcess.status, 'verify');
    }
  }
}
