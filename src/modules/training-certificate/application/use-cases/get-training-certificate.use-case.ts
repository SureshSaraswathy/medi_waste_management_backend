import { Injectable, Inject } from '@nestjs/common';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificate } from '../../domain/entities/training-certificate.domain.entity';
import { TrainingCertificateNotFoundException } from '../../domain/exceptions/training-certificate.exceptions';

@Injectable()
export class GetTrainingCertificateUseCase {
  constructor(
    @Inject(TRAINING_CERTIFICATE_REPOSITORY_TOKEN)
    private readonly certificateRepository: ITrainingCertificateRepository,
  ) {}

  async execute(certificateId: string): Promise<TrainingCertificate> {
    const certificate = await this.certificateRepository.findById(certificateId);
    if (!certificate) {
      throw new TrainingCertificateNotFoundException(certificateId);
    }
    return certificate;
  }
}
