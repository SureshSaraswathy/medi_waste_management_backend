import { TrainingCertificate } from '../entities/training-certificate.domain.entity';

export const TRAINING_CERTIFICATE_REPOSITORY_TOKEN = 'TRAINING_CERTIFICATE_REPOSITORY';

export interface ITrainingCertificateRepository {
  create(certificate: TrainingCertificate): Promise<TrainingCertificate>;
  findById(certificateId: string): Promise<TrainingCertificate | null>;
  findByCertificateNo(certificateNo: string, companyId?: string): Promise<TrainingCertificate | null>;
  findAll(companyId?: string, activeOnly?: boolean): Promise<TrainingCertificate[]>;
  findAllByFilters(filters: {
    companyId?: string;
    hcfId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }): Promise<TrainingCertificate[]>;
  update(certificate: TrainingCertificate): Promise<TrainingCertificate>;
  delete(certificateId: string): Promise<void>;
}
