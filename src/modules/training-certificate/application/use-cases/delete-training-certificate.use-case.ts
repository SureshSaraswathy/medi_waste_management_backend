import { Injectable, Inject } from '@nestjs/common';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificateNotFoundException } from '../../domain/exceptions/training-certificate.exceptions';

@Injectable()
export class DeleteTrainingCertificateUseCase {
  constructor(
    @Inject(TRAINING_CERTIFICATE_REPOSITORY_TOKEN)
    private readonly certificateRepository: ITrainingCertificateRepository,
  ) {}

  async execute(certificateId: string): Promise<void> {
    const certificate = await this.certificateRepository.findById(certificateId);
    if (!certificate) {
      throw new TrainingCertificateNotFoundException(certificateId);
    }
    await this.certificateRepository.delete(certificateId);
  }
}
