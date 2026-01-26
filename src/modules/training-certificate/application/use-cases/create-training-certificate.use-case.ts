import { Injectable, Inject } from '@nestjs/common';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificate } from '../../domain/entities/training-certificate.domain.entity';
import { CreateTrainingCertificateDto } from '../dto/create-training-certificate.dto';
import { DuplicateCertificateNoException } from '../../domain/exceptions/training-certificate.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateTrainingCertificateUseCase {
  constructor(
    @Inject(TRAINING_CERTIFICATE_REPOSITORY_TOKEN)
    private readonly certificateRepository: ITrainingCertificateRepository,
  ) {}

  async execute(
    createDto: CreateTrainingCertificateDto,
    createdBy?: string,
  ): Promise<TrainingCertificate> {
    const existing = await this.certificateRepository.findByCertificateNo(
      createDto.certificateNo,
      createDto.companyId,
    );
    if (existing) {
      throw new DuplicateCertificateNoException(createDto.certificateNo);
    }

    const certificate = TrainingCertificate.create({
      certificateId: randomUUID(),
      certificateNo: createDto.certificateNo,
      staffName: createDto.staffName,
      staffCode: createDto.staffCode,
      designation: createDto.designation || '',
      hcfId: createDto.hcfId,
      trainingDate: new Date(createDto.trainingDate),
      companyId: createDto.companyId,
      trainedBy: createDto.trainedBy,
      createdBy: createdBy || null,
    });

    return this.certificateRepository.create(certificate);
  }
}
