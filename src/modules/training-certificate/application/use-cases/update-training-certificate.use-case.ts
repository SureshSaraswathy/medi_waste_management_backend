import { Injectable, Inject } from '@nestjs/common';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificate } from '../../domain/entities/training-certificate.domain.entity';
import { UpdateTrainingCertificateDto } from '../dto/update-training-certificate.dto';
import { TrainingCertificateNotFoundException } from '../../domain/exceptions/training-certificate.exceptions';

@Injectable()
export class UpdateTrainingCertificateUseCase {
  constructor(
    @Inject(TRAINING_CERTIFICATE_REPOSITORY_TOKEN)
    private readonly certificateRepository: ITrainingCertificateRepository,
  ) {}

  async execute(
    certificateId: string,
    updateDto: UpdateTrainingCertificateDto,
    modifiedBy?: string,
  ): Promise<TrainingCertificate> {
    const certificate = await this.certificateRepository.findById(certificateId);
    if (!certificate) {
      throw new TrainingCertificateNotFoundException(certificateId);
    }

    const updateData: any = {};
    if (updateDto.staffName !== undefined) updateData.staffName = updateDto.staffName;
    if (updateDto.staffCode !== undefined) updateData.staffCode = updateDto.staffCode;
    if (updateDto.designation !== undefined) updateData.designation = updateDto.designation;
    if (updateDto.hcfId !== undefined) updateData.hcfId = updateDto.hcfId;
    if (updateDto.trainingDate !== undefined) updateData.trainingDate = new Date(updateDto.trainingDate);
    if (updateDto.trainedBy !== undefined) updateData.trainedBy = updateDto.trainedBy;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    updateData.modifiedBy = modifiedBy || null;

    certificate.update(updateData);
    return this.certificateRepository.update(certificate);
  }
}
