import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AgreementEntity } from '../transaction/agreement.entity';
import { IAgreementRepository } from '../../domain/interfaces/agreement.repository.interface';
import { Agreement } from '../../domain/entities/agreement.domain.entity';

@Injectable()
export class AgreementRepository implements IAgreementRepository {
  constructor(
    @InjectRepository(AgreementEntity, 'transaction')
    private readonly repository: Repository<AgreementEntity>,
    @InjectDataSource('transaction')
    private readonly dataSource: DataSource,
  ) {}

  async findAll(contractId?: string, status?: string): Promise<Agreement[]> {
    const query = this.repository.createQueryBuilder('agreement')
      .where('agreement.isDeleted = :isDeleted', { isDeleted: false });

    if (contractId) {
      query.andWhere('agreement.contractId = :contractId', { contractId });
    }
    if (status) {
      query.andWhere('agreement.status = :status', { status });
    }

    const entities = await query.orderBy('agreement.createdOn', 'DESC').getMany();
    return entities.map(e => this.toDomain(e));
  }

  async findOne(id: string): Promise<Agreement | null> {
    const entity = await this.repository.findOne({
      where: { agreementId: id, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(agreement: Agreement): Promise<Agreement> {
    const entity = this.toEntity(agreement);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(agreement: Agreement): Promise<Agreement> {
    const entity = this.toEntity(agreement);
    await this.repository.update(agreement.agreementId, entity);
    const updated = await this.findOne(agreement.agreementId);
    if (!updated) {
      throw new Error('Agreement not found after update');
    }
    return updated;
  }

  async delete(id: string, modifiedBy?: string | null): Promise<void> {
    await this.repository.update(id, { 
      isDeleted: true,
      modifiedBy: modifiedBy || null,
      modifiedOn: new Date(),
    });
  }

  private toDomain(entity: AgreementEntity): Agreement {
    return Agreement.reconstitute({
      agreementId: entity.agreementId,
      agreementID: entity.agreementID,
      agreementNum: entity.agreementNum,
      contractId: entity.contractId,
      agreementDate: entity.agreementDate,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(agreement: Agreement): Partial<AgreementEntity> {
    return {
      agreementId: agreement.agreementId,
      agreementID: agreement.agreementID,
      agreementNum: agreement.agreementNum,
      contractId: agreement.contractId,
      agreementDate: agreement.agreementDate,
      status: agreement.status,
      createdBy: agreement.createdBy,
      createdOn: agreement.createdOn,
      modifiedBy: agreement.modifiedBy,
      modifiedOn: agreement.modifiedOn,
      isDeleted: agreement.isDeleted,
    };
  }
}
