import { Injectable, Inject } from '@nestjs/common';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificate } from '../../domain/entities/training-certificate.domain.entity';

@Injectable()
export class GetAllTrainingCertificatesUseCase {
  constructor(
    @Inject(TRAINING_CERTIFICATE_REPOSITORY_TOKEN)
    private readonly certificateRepository: ITrainingCertificateRepository,
  ) {}

  async execute(
    companyId?: string,
    activeOnly?: boolean,
    filters?: {
      hcfId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
    },
  ): Promise<TrainingCertificate[]> {
    if (filters && (filters.hcfId || filters.status || filters.dateFrom || filters.dateTo || filters.search)) {
      return this.certificateRepository.findAllByFilters({
        companyId,
        ...filters,
      });
    }
    return this.certificateRepository.findAll(companyId, activeOnly);
  }
}
