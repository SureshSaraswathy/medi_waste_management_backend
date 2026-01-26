import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWasteProcessRepository, WASTE_PROCESS_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-process.repository.interface';
import { WasteProcess } from '../../domain/entities/waste-process.domain.entity';
import { WasteProcessEntity, WasteProcessStatus } from '../transaction/waste-process.entity';

@Injectable()
export class WasteProcessRepository implements IWasteProcessRepository {
  constructor(
    @InjectRepository(WasteProcessEntity, 'transaction')
    private readonly wasteProcessRepo: Repository<WasteProcessEntity>,
  ) {}

  async create(wasteProcess: WasteProcess): Promise<WasteProcess> {
    const entity = this.toEntity(wasteProcess);
    const saved = await this.wasteProcessRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(wasteProcessId: string): Promise<WasteProcess | null> {
    const entity = await this.wasteProcessRepo.findOne({
      where: { wasteProcessId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<WasteProcess[]> {
    const entities = await this.wasteProcessRepo.find({
      where: { isDeleted: false },
      order: { processDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string): Promise<WasteProcess[]> {
    const entities = await this.wasteProcessRepo.find({
      where: { companyId, isDeleted: false },
      order: { processDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WasteProcess[]> {
    try {
      // For date columns, format dates as YYYY-MM-DD for PostgreSQL date comparison
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const entities = await this.wasteProcessRepo
        .createQueryBuilder('wp')
        .where('wp.process_date >= :startDate', { startDate: startDateStr })
        .andWhere('wp.process_date <= :endDate', { endDate: endDateStr })
        .andWhere('wp.is_deleted = :isDeleted', { isDeleted: false })
        .orderBy('wp.process_date', 'DESC')
        .addOrderBy('wp.created_on', 'DESC')
        .getMany();
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      console.error('Error in findByDateRange:', error);
      throw error;
    }
  }

  async findByStatus(status: WasteProcessStatus): Promise<WasteProcess[]> {
    const entities = await this.wasteProcessRepo.find({
      where: { status, isDeleted: false },
      order: { processDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompanyAndDate(companyId: string, processDate: Date): Promise<WasteProcess | null> {
    const entity = await this.wasteProcessRepo.findOne({
      where: { companyId, processDate, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(wasteProcess: WasteProcess): Promise<WasteProcess> {
    const entity = this.toEntity(wasteProcess);
    const saved = await this.wasteProcessRepo.save(entity);
    return this.toDomain(saved);
  }

  async softDelete(wasteProcessId: string): Promise<void> {
    await this.wasteProcessRepo.update(
      { wasteProcessId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(wasteProcess: WasteProcess): WasteProcessEntity {
    const entity = new WasteProcessEntity();
    entity.wasteProcessId = wasteProcess.wasteProcessId;
    entity.companyId = wasteProcess.companyId;
    entity.processDate = wasteProcess.processDate;
    entity.incinerationWeightKg = wasteProcess.incinerationWeightKg;
    entity.autoclaveWeightKg = wasteProcess.autoclaveWeightKg;
    entity.status = wasteProcess.status;
    entity.notes = wasteProcess.notes;
    entity.createdBy = wasteProcess.createdBy;
    entity.createdOn = wasteProcess.createdOn;
    entity.modifiedBy = wasteProcess.modifiedBy;
    entity.modifiedOn = wasteProcess.modifiedOn;
    entity.verifiedBy = wasteProcess.verifiedBy;
    entity.verifiedOn = wasteProcess.verifiedOn;
    entity.closedBy = wasteProcess.closedBy;
    entity.closedOn = wasteProcess.closedOn;
    entity.isDeleted = wasteProcess.isDeleted;
    return entity;
  }

  private toDomain(entity: WasteProcessEntity): WasteProcess {
    return WasteProcess.reconstitute({
      wasteProcessId: entity.wasteProcessId,
      companyId: entity.companyId,
      processDate: entity.processDate,
      incinerationWeightKg: entity.incinerationWeightKg,
      autoclaveWeightKg: entity.autoclaveWeightKg,
      status: entity.status,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      verifiedBy: entity.verifiedBy,
      verifiedOn: entity.verifiedOn,
      closedBy: entity.closedBy,
      closedOn: entity.closedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
