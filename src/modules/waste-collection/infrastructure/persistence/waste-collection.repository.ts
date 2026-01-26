import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';
import { WasteCollectionEntity } from '../transaction/waste-collection.entity';

@Injectable()
export class WasteCollectionRepository implements IWasteCollectionRepository {
  constructor(
    @InjectRepository(WasteCollectionEntity, 'transaction')
    private readonly wasteCollectionRepo: Repository<WasteCollectionEntity>,
  ) {}

  async create(wasteCollection: WasteCollection): Promise<WasteCollection> {
    const entity = this.toEntity(wasteCollection);
    const saved = await this.wasteCollectionRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(wasteCollectionId: string): Promise<WasteCollection | null> {
    const entity = await this.wasteCollectionRepo.findOne({
      where: { wasteCollectionId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<WasteCollection[]> {
    const entities = await this.wasteCollectionRepo.find({
      where: { isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByBarcodeAndDate(barcode: string, date: Date): Promise<WasteCollection | null> {
    const dateStr = date.toISOString().split('T')[0];
    const entity = await this.wasteCollectionRepo
      .createQueryBuilder('wc')
      .where('wc.barcode = :barcode', { barcode })
      .andWhere('wc.collection_date = :date', { date: dateStr })
      .andWhere('wc.is_deleted = false')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WasteCollection[]> {
    const entities = await this.wasteCollectionRepo
      .createQueryBuilder('wc')
      .where('wc.collection_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
      .andWhere('wc.collection_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] })
      .andWhere('wc.is_deleted = false')
      .orderBy('wc.collection_date', 'DESC')
      .addOrderBy('wc.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByDate(date: Date): Promise<WasteCollection[]> {
    const dateStr = date.toISOString().split('T')[0];
    const entities = await this.wasteCollectionRepo
      .createQueryBuilder('wc')
      .where('wc.collection_date = :date', { date: dateStr })
      .andWhere('wc.is_deleted = false')
      .orderBy('wc.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcf(hcfId: string, startDate?: Date, endDate?: Date): Promise<WasteCollection[]> {
    const query = this.wasteCollectionRepo
      .createQueryBuilder('wc')
      .where('wc.hcf_id = :hcfId', { hcfId })
      .andWhere('wc.is_deleted = false');

    if (startDate) {
      query.andWhere('wc.collection_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] });
    }
    if (endDate) {
      query.andWhere('wc.collection_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] });
    }

    const entities = await query
      .orderBy('wc.collection_date', 'DESC')
      .addOrderBy('wc.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string, startDate?: Date, endDate?: Date): Promise<WasteCollection[]> {
    const query = this.wasteCollectionRepo
      .createQueryBuilder('wc')
      .where('wc.company_id = :companyId', { companyId })
      .andWhere('wc.is_deleted = false');

    if (startDate) {
      query.andWhere('wc.collection_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] });
    }
    if (endDate) {
      query.andWhere('wc.collection_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] });
    }

    const entities = await query
      .orderBy('wc.collection_date', 'DESC')
      .addOrderBy('wc.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(status: string): Promise<WasteCollection[]> {
    const entities = await this.wasteCollectionRepo.find({
      where: { status: status as any, isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByRouteAssignment(routeAssignmentId: string): Promise<WasteCollection[]> {
    const entities = await this.wasteCollectionRepo.find({
      where: { routeAssignmentId, isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(wasteCollectionId: string, wasteCollection: WasteCollection): Promise<WasteCollection> {
    const entity = this.toEntity(wasteCollection);
    await this.wasteCollectionRepo.update({ wasteCollectionId }, entity);
    const updated = await this.findById(wasteCollectionId);
    if (!updated) {
      throw new Error(`WasteCollection ${wasteCollectionId} not found after update`);
    }
    return updated;
  }

  async softDelete(wasteCollectionId: string): Promise<void> {
    await this.wasteCollectionRepo.update(
      { wasteCollectionId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(wasteCollection: WasteCollection): WasteCollectionEntity {
    const entity = new WasteCollectionEntity();
    entity.wasteCollectionId = wasteCollection.wasteCollectionId;
    entity.barcode = wasteCollection.barcode;
    entity.collectionDate = wasteCollection.collectionDate;
    entity.companyId = wasteCollection.companyId;
    entity.hcfId = wasteCollection.hcfId;
    entity.wasteColor = wasteCollection.wasteColor;
    entity.weightKg = wasteCollection.weightKg;
    entity.status = wasteCollection.status;
    entity.routeAssignmentId = wasteCollection.routeAssignmentId;
    entity.collectedBy = wasteCollection.collectedBy;
    entity.collectedAt = wasteCollection.collectedAt;
    entity.notes = wasteCollection.notes;
    entity.createdBy = wasteCollection.createdBy;
    entity.createdOn = wasteCollection.createdOn;
    entity.modifiedBy = wasteCollection.modifiedBy;
    entity.modifiedOn = wasteCollection.modifiedOn;
    entity.isDeleted = wasteCollection.isDeleted;
    return entity;
  }

  private toDomain(entity: WasteCollectionEntity): WasteCollection {
    return WasteCollection.reconstitute({
      wasteCollectionId: entity.wasteCollectionId,
      barcode: entity.barcode,
      collectionDate: entity.collectionDate,
      companyId: entity.companyId,
      hcfId: entity.hcfId,
      wasteColor: entity.wasteColor,
      weightKg: entity.weightKg,
      status: entity.status,
      routeAssignmentId: entity.routeAssignmentId,
      collectedBy: entity.collectedBy,
      collectedAt: entity.collectedAt,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
