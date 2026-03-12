import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AgreementClauseEntity } from '../transaction/agreement-clause.entity';
import { IAgreementClauseRepository } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClause } from '../../domain/entities/agreement-clause.domain.entity';

@Injectable()
export class AgreementClauseRepository implements IAgreementClauseRepository {
  constructor(
    @InjectRepository(AgreementClauseEntity, 'transaction')
    private readonly repository: Repository<AgreementClauseEntity>,
    @InjectDataSource('transaction')
    private readonly dataSource: DataSource,
  ) {}

  async findAll(agreementTemplateId?: string, status?: string): Promise<AgreementClause[]> {
    const query = this.repository.createQueryBuilder('clause')
      .where('clause.isDeleted = :isDeleted', { isDeleted: false });

    if (agreementTemplateId) {
      query.andWhere('clause.agreementTemplateId = :agreementTemplateId', { agreementTemplateId });
    }
    if (status) {
      query.andWhere('clause.status = :status', { status });
    }

    const entities = await query
      .orderBy('clause.agreementTemplateId', 'ASC')
      .addOrderBy('clause.sequenceNo', 'ASC')
      .getMany();
    
    return entities.map(e => this.toDomain(e));
  }

  async findOne(id: string): Promise<AgreementClause | null> {
    const entity = await this.repository.findOne({
      where: { clauseId: id, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(clause: AgreementClause): Promise<AgreementClause> {
    const entity = this.toEntity(clause);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(clause: AgreementClause): Promise<AgreementClause> {
    const entity = this.toEntity(clause);
    await this.repository.update(clause.clauseId, entity);
    const updated = await this.findOne(clause.clauseId);
    if (!updated) {
      throw new Error('Agreement clause not found after update');
    }
    return updated;
  }

  async updateSequence(id: string, newSequenceNo: number): Promise<AgreementClause> {
    await this.repository.update(id, { 
      sequenceNo: newSequenceNo,
      modifiedOn: new Date(),
    });
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error('Agreement clause not found after update');
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

  private toDomain(entity: AgreementClauseEntity): AgreementClause {
    return AgreementClause.reconstitute({
      clauseId: entity.clauseId,
      agreementClauseID: entity.agreementClauseID,
      agreementTemplateId: entity.agreementTemplateId,
      pointNum: entity.pointNum,
      pointTitle: entity.pointTitle,
      pointText: entity.pointText,
      sequenceNo: entity.sequenceNo,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(clause: AgreementClause): Partial<AgreementClauseEntity> {
    return {
      clauseId: clause.clauseId,
      agreementClauseID: clause.agreementClauseID,
      agreementTemplateId: clause.agreementTemplateId,
      pointNum: clause.pointNum,
      pointTitle: clause.pointTitle,
      pointText: clause.pointText,
      sequenceNo: clause.sequenceNo,
      status: clause.status,
      createdBy: clause.createdBy,
      createdOn: clause.createdOn,
      modifiedBy: clause.modifiedBy,
      modifiedOn: clause.modifiedOn,
      isDeleted: clause.isDeleted,
    };
  }
}
