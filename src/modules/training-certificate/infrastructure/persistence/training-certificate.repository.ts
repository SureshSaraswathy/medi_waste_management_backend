import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { DataSource } from 'typeorm';
import {
  ITrainingCertificateRepository,
  TRAINING_CERTIFICATE_REPOSITORY_TOKEN,
} from '../../domain/interfaces/training-certificate.repository.interface';
import { TrainingCertificate } from '../../domain/entities/training-certificate.domain.entity';
import { TrainingCertificateEntity } from '../transaction/training-certificate.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class TrainingCertificateRepository implements ITrainingCertificateRepository {
  constructor(
    @InjectRepository(TrainingCertificateEntity, 'transaction')
    private readonly repository: Repository<TrainingCertificateEntity>,
    @InjectDataSource('transaction')
    private readonly dataSource: DataSource,
  ) {}

  async create(certificate: TrainingCertificate): Promise<TrainingCertificate> {
    const entity = this.toEntity(certificate);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(certificateId: string): Promise<TrainingCertificate | null> {
    const entity = await this.repository.findOne({
      where: { certificateId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCertificateNo(certificateNo: string, companyId?: string): Promise<TrainingCertificate | null> {
    const where: any = { certificateNo, isDeleted: false };
    if (companyId) {
      where.companyId = companyId;
    }
    const entity = await this.repository.findOne({ where });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(companyId?: string, activeOnly?: boolean): Promise<TrainingCertificate[]> {
    const where: any = { isDeleted: false };
    if (companyId) {
      where.companyId = companyId;
    }
    if (activeOnly) {
      where.status = MasterStatus.ACTIVE;
    }
    const entities = await this.repository.find({ where, order: { createdOn: 'DESC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllByFilters(filters: {
    companyId?: string;
    hcfId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }): Promise<TrainingCertificate[]> {
    const queryBuilder = this.repository.createQueryBuilder('cert')
      .where('cert.is_deleted = :isDeleted', { isDeleted: false });

    if (filters.companyId) {
      queryBuilder.andWhere('cert.company_id = :companyId', { companyId: filters.companyId });
    }

    if (filters.hcfId) {
      queryBuilder.andWhere('cert.hcf_id = :hcfId', { hcfId: filters.hcfId });
    }

    if (filters.status) {
      queryBuilder.andWhere('cert.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('cert.training_date >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('cert.training_date <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(cert.certificate_no ILIKE :search OR cert.staff_name ILIKE :search OR cert.staff_code ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('cert.created_on', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async update(certificate: TrainingCertificate): Promise<TrainingCertificate> {
    const entity = this.toEntity(certificate);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(certificateId: string): Promise<void> {
    await this.repository.update(
      { certificateId, isDeleted: false },
      { isDeleted: true },
    );
  }

  private toDomain(entity: TrainingCertificateEntity): TrainingCertificate {
    return TrainingCertificate.reconstitute({
      certificateId: entity.certificateId,
      certificateNo: entity.certificateNo,
      staffName: entity.staffName,
      staffCode: entity.staffCode,
      designation: entity.designation || '',
      hcfId: entity.hcfId,
      trainingDate: entity.trainingDate,
      companyId: entity.companyId,
      trainedBy: entity.trainedBy,
      status: entity.status as MasterStatus,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: TrainingCertificate): TrainingCertificateEntity {
    const entity = new TrainingCertificateEntity();
    entity.certificateId = domain.certificateId;
    entity.certificateNo = domain.certificateNo;
    entity.staffName = domain.staffName;
    entity.staffCode = domain.staffCode;
    entity.designation = domain.designation || null;
    entity.hcfId = domain.hcfId;
    entity.trainingDate = domain.trainingDate;
    entity.companyId = domain.companyId;
    entity.trainedBy = domain.trainedBy;
    entity.status = domain.status;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.modifiedBy = domain.modifiedBy;
    entity.modifiedOn = domain.modifiedOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }
}
