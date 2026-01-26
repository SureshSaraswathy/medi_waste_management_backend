import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IVehicleWasteCollectionRepository, VEHICLE_WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/vehicle-waste-collection.repository.interface';
import { VehicleWasteCollection } from '../../domain/entities/vehicle-waste-collection.domain.entity';
import { VehicleWasteCollectionEntity, VehicleWasteCollectionStatus } from '../transaction/vehicle-waste-collection.entity';

@Injectable()
export class VehicleWasteCollectionRepository implements IVehicleWasteCollectionRepository {
  constructor(
    @InjectRepository(VehicleWasteCollectionEntity, 'transaction')
    private readonly vehicleWasteCollectionRepo: Repository<VehicleWasteCollectionEntity>,
  ) {}

  async create(vehicleWasteCollection: VehicleWasteCollection): Promise<VehicleWasteCollection> {
    const entity = this.toEntity(vehicleWasteCollection);
    const saved = await this.vehicleWasteCollectionRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(vehicleWasteCollectionId: string): Promise<VehicleWasteCollection | null> {
    const entity = await this.vehicleWasteCollectionRepo.findOne({
      where: { vehicleWasteCollectionId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<VehicleWasteCollection[]> {
    const entities = await this.vehicleWasteCollectionRepo.find({
      where: { isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByVehicle(vehicleId: string): Promise<VehicleWasteCollection[]> {
    const entities = await this.vehicleWasteCollectionRepo.find({
      where: { vehicleId, isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<VehicleWasteCollection[]> {
    try {
      // For date columns, we need to compare dates only (not time)
      // Format dates as YYYY-MM-DD for PostgreSQL date comparison
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const entities = await this.vehicleWasteCollectionRepo
        .createQueryBuilder('vwc')
        .where('vwc.collection_date >= :startDate', { startDate: startDateStr })
        .andWhere('vwc.collection_date <= :endDate', { endDate: endDateStr })
        .andWhere('vwc.is_deleted = :isDeleted', { isDeleted: false })
        .orderBy('vwc.collection_date', 'DESC')
        .addOrderBy('vwc.created_on', 'DESC')
        .getMany();
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      console.error('Error in findByDateRange:', error);
      throw error;
    }
  }

  async findByStatus(status: VehicleWasteCollectionStatus): Promise<VehicleWasteCollection[]> {
    const entities = await this.vehicleWasteCollectionRepo.find({
      where: { status, isDeleted: false },
      order: { collectionDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByVehicleAndDate(vehicleId: string, collectionDate: Date): Promise<VehicleWasteCollection | null> {
    const entity = await this.vehicleWasteCollectionRepo.findOne({
      where: { vehicleId, collectionDate, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(vehicleWasteCollection: VehicleWasteCollection): Promise<VehicleWasteCollection> {
    const entity = this.toEntity(vehicleWasteCollection);
    const saved = await this.vehicleWasteCollectionRepo.save(entity);
    return this.toDomain(saved);
  }

  async softDelete(vehicleWasteCollectionId: string): Promise<void> {
    await this.vehicleWasteCollectionRepo.update(
      { vehicleWasteCollectionId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(vehicleWasteCollection: VehicleWasteCollection): VehicleWasteCollectionEntity {
    const entity = new VehicleWasteCollectionEntity();
    entity.vehicleWasteCollectionId = vehicleWasteCollection.vehicleWasteCollectionId;
    entity.vehicleId = vehicleWasteCollection.vehicleId;
    entity.collectionDate = vehicleWasteCollection.collectionDate;
    entity.grossWeightKg = vehicleWasteCollection.grossWeightKg;
    entity.tareWeightKg = vehicleWasteCollection.tareWeightKg;
    entity.netWeightKg = vehicleWasteCollection.netWeightKg;
    entity.incinerationWeightKg = vehicleWasteCollection.incinerationWeightKg;
    entity.autoclaveWeightKg = vehicleWasteCollection.autoclaveWeightKg;
    entity.vehicleKm = vehicleWasteCollection.vehicleKm;
    entity.fuelUsageLiters = vehicleWasteCollection.fuelUsageLiters;
    entity.status = vehicleWasteCollection.status;
    entity.notes = vehicleWasteCollection.notes;
    entity.createdBy = vehicleWasteCollection.createdBy;
    entity.createdOn = vehicleWasteCollection.createdOn;
    entity.modifiedBy = vehicleWasteCollection.modifiedBy;
    entity.modifiedOn = vehicleWasteCollection.modifiedOn;
    entity.verifiedBy = vehicleWasteCollection.verifiedBy;
    entity.verifiedOn = vehicleWasteCollection.verifiedOn;
    entity.isDeleted = vehicleWasteCollection.isDeleted;
    return entity;
  }

  private toDomain(entity: VehicleWasteCollectionEntity): VehicleWasteCollection {
    return VehicleWasteCollection.reconstitute({
      vehicleWasteCollectionId: entity.vehicleWasteCollectionId,
      vehicleId: entity.vehicleId,
      collectionDate: entity.collectionDate,
      grossWeightKg: entity.grossWeightKg,
      tareWeightKg: entity.tareWeightKg,
      netWeightKg: entity.netWeightKg,
      incinerationWeightKg: entity.incinerationWeightKg,
      autoclaveWeightKg: entity.autoclaveWeightKg,
      vehicleKm: entity.vehicleKm,
      fuelUsageLiters: entity.fuelUsageLiters,
      status: entity.status,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      verifiedBy: entity.verifiedBy,
      verifiedOn: entity.verifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
