import { Injectable, Inject } from '@nestjs/common';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { WasteProcessStatus } from '../../infrastructure/transaction/waste-process.entity';

@Injectable()
export class GetAllWasteProcessesUseCase {
  constructor(
    @Inject(WASTE_PROCESS_REPOSITORY_TOKEN)
    private readonly wasteProcessRepository: IWasteProcessRepository,
  ) {}

  async execute(
    companyId?: string,
    startDate?: string,
    endDate?: string,
    status?: string,
  ): Promise<WasteProcess[]> {
    try {
      let results: WasteProcess[];

      // Start with base query based on filters
      if (startDate && endDate) {
        // Parse dates and ensure they're valid
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date format');
        }
        
        results = await this.wasteProcessRepository.findByDateRange(start, end);
      } else if (companyId) {
        results = await this.wasteProcessRepository.findByCompany(companyId);
      } else {
        results = await this.wasteProcessRepository.findAll();
      }

      // Apply status filter if provided
      if (status) {
        results = results.filter(t => t.status === (status as WasteProcessStatus));
      }

      return results;
    } catch (error) {
      console.error('Error in GetAllWasteProcessesUseCase:', error);
      throw error;
    }
  }
}
