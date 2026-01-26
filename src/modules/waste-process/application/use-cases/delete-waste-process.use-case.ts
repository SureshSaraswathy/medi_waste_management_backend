import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcessNotFoundException } from '../../domain/exceptions/waste-process.exceptions';

@Injectable()
export class DeleteWasteProcessUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(wasteProcessId: string): Promise<void> {
    const wasteProcess = await this.wasteProcessRepository.findById(
      wasteProcessId,
    );
    if (!wasteProcess) {
      throw new WasteProcessNotFoundException(wasteProcessId);
    }

    await this.wasteProcessRepository.softDelete(wasteProcessId);
  }
}
