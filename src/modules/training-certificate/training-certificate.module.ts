import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingCertificateController } from './presentation/training-certificate.controller';
import { TrainingCertificateRepository } from './infrastructure/persistence/training-certificate.repository';
import { TrainingCertificateEntity } from './infrastructure/transaction/training-certificate.entity';
import { CreateTrainingCertificateUseCase } from './application/use-cases/create-training-certificate.use-case';
import { GetTrainingCertificateUseCase } from './application/use-cases/get-training-certificate.use-case';
import { GetAllTrainingCertificatesUseCase } from './application/use-cases/get-all-training-certificates.use-case';
import { UpdateTrainingCertificateUseCase } from './application/use-cases/update-training-certificate.use-case';
import { DeleteTrainingCertificateUseCase } from './application/use-cases/delete-training-certificate.use-case';
import { TRAINING_CERTIFICATE_REPOSITORY_TOKEN } from './domain/interfaces/training-certificate.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingCertificateEntity], 'transaction')],
  controllers: [TrainingCertificateController],
  providers: [
    {
      provide: TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
      useClass: TrainingCertificateRepository,
    },
    CreateTrainingCertificateUseCase,
    GetTrainingCertificateUseCase,
    GetAllTrainingCertificatesUseCase,
    UpdateTrainingCertificateUseCase,
    DeleteTrainingCertificateUseCase,
  ],
  exports: [TRAINING_CERTIFICATE_REPOSITORY_TOKEN],
})
export class TrainingCertificateModule {}
