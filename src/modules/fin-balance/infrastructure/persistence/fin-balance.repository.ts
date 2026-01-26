import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinBalanceEntity } from '../transaction/fin-balance.entity';
import { FinBalance } from '../../domain/entities/fin-balance.domain.entity';
import { IFinBalanceRepository, FIN_BALANCE_REPOSITORY_TOKEN } from '../../domain/interfaces/fin-balance.repository.interface';

@Injectable()
export class FinBalanceRepository implements IFinBalanceRepository {
  constructor(
    @InjectRepository(FinBalanceEntity, 'transaction')
    private readonly repository: Repository<FinBalanceEntity>,
  ) {}

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    return value;
  }

  private toDomain(entity: FinBalanceEntity): FinBalance {
    return FinBalance.reconstitute({
      finBalanceId: entity.finBalanceId,
      companyId: entity.companyId,
      hcfId: entity.hcfId,
      openingBalance: Number(entity.openingBalance),
      currentBalance: Number(entity.currentBalance),
      isManual: entity.isManual,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: this.toDate(entity.createdOn),
      modifiedBy: entity.modifiedBy,
      modifiedOn: this.toDate(entity.modifiedOn),
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(domain: FinBalance): FinBalanceEntity {
    const entity = new FinBalanceEntity();
    entity.finBalanceId = domain.finBalanceId;
    entity.companyId = domain.companyId;
    entity.hcfId = domain.hcfId;
    entity.openingBalance = domain.openingBalance;
    entity.currentBalance = domain.currentBalance;
    entity.isManual = domain.isManual;
    entity.notes = domain.notes;
    entity.createdBy = domain.createdBy;
    entity.createdOn = domain.createdOn;
    entity.modifiedBy = domain.modifiedBy;
    entity.modifiedOn = domain.modifiedOn;
    entity.isDeleted = domain.isDeleted;
    return entity;
  }

  async create(finBalance: FinBalance): Promise<FinBalance> {
    const entity = this.toEntity(finBalance);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(finBalanceId: string): Promise<FinBalance | null> {
    const entity = await this.repository.findOne({
      where: { finBalanceId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<FinBalance[]> {
    const entities = await this.repository.find({
      where: { companyId, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByHcf(hcfId: string): Promise<FinBalance | null> {
    const entity = await this.repository.findOne({
      where: { hcfId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyAndHcf(companyId: string, hcfId: string): Promise<FinBalance | null> {
    const entity = await this.repository.findOne({
      where: { companyId, hcfId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<FinBalance[]> {
    const entities = await this.repository.find({
      where: { isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async update(finBalance: FinBalance): Promise<FinBalance> {
    const entity = this.toEntity(finBalance);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async delete(finBalanceId: string, deletedBy?: string | null): Promise<void> {
    await this.repository.update(
      { finBalanceId },
      {
        isDeleted: true,
        modifiedBy: deletedBy ?? null,
        modifiedOn: new Date(),
      }
    );
  }

  async bulkCreate(finBalances: FinBalance[]): Promise<FinBalance[]> {
    const entities = finBalances.map(fb => this.toEntity(fb));
    const saved = await this.repository.save(entities);
    return saved.map(e => this.toDomain(e));
  }

  async bulkUpdate(finBalances: FinBalance[]): Promise<FinBalance[]> {
    const entities = finBalances.map(fb => this.toEntity(fb));
    const saved = await this.repository.save(entities);
    return saved.map(e => this.toDomain(e));
  }
}
