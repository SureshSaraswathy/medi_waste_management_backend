import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFinanceYearRepository } from '../../domain/interfaces/finance-year.repository.interface';
import { FinanceYear } from '../../domain/entities/finance-year.domain.entity';
import { FinanceYearEntity } from './finance-year.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class FinanceYearRepository implements IFinanceYearRepository {
  constructor(
    @InjectRepository(FinanceYearEntity, 'master')
    private readonly financeYearRepo: Repository<FinanceYearEntity>,
  ) {}

  async create(financeYear: FinanceYear): Promise<FinanceYear> {
    const entity = this.toEntity(financeYear);
    const saved = await this.financeYearRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(financeYearId: string): Promise<FinanceYear | null> {
    const entity = await this.financeYearRepo.findOne({
      where: { financeYearId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<FinanceYear[]> {
    const entities = await this.financeYearRepo.find({
      where: { isDeleted: false },
      order: { fyStartDate: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<FinanceYear[]> {
    const entities = await this.financeYearRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { fyStartDate: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(financeYearId: string, financeYear: FinanceYear): Promise<FinanceYear> {
    const entity = this.toEntity(financeYear);
    await this.financeYearRepo.update({ financeYearId }, entity);
    const updated = await this.findById(financeYearId);
    if (!updated) {
      throw new Error(`Finance Year ${financeYearId} not found after update`);
    }
    return updated;
  }

  async softDelete(financeYearId: string): Promise<void> {
    await this.financeYearRepo.update(
      { financeYearId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByFinYear(finYear: string): Promise<FinanceYear | null> {
    const entity = await this.financeYearRepo.findOne({
      where: { finYear, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllOrderedByStartDate(): Promise<FinanceYear[]> {
    const entities = await this.financeYearRepo.find({
      where: { isDeleted: false },
      order: { fyStartDate: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActiveOrderedByStartDate(): Promise<FinanceYear[]> {
    const entities = await this.financeYearRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { fyStartDate: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(financeYear: FinanceYear): FinanceYearEntity {
    const entity = new FinanceYearEntity();
    entity.financeYearId = financeYear.financeYearId;
    entity.finYear = financeYear.finYear;
    // Ensure dates are Date objects (not strings)
    entity.fyStartDate = financeYear.fyStartDate instanceof Date 
      ? financeYear.fyStartDate 
      : new Date(financeYear.fyStartDate);
    entity.fyEndDate = financeYear.fyEndDate instanceof Date 
      ? financeYear.fyEndDate 
      : new Date(financeYear.fyEndDate);
    entity.status = financeYear.status;
    entity.createdBy = financeYear.createdBy;
    entity.createdOn = financeYear.createdOn instanceof Date 
      ? financeYear.createdOn 
      : new Date(financeYear.createdOn);
    entity.modifiedBy = financeYear.modifiedBy;
    entity.modifiedOn = financeYear.modifiedOn instanceof Date 
      ? financeYear.modifiedOn 
      : new Date(financeYear.modifiedOn);
    entity.isDeleted = financeYear.isDeleted;
    return entity;
  }

  private toDomain(entity: FinanceYearEntity): FinanceYear {
    return FinanceYear.reconstitute({
      financeYearId: entity.financeYearId,
      finYear: entity.finYear,
      fyStartDate: entity.fyStartDate,
      fyEndDate: entity.fyEndDate,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
