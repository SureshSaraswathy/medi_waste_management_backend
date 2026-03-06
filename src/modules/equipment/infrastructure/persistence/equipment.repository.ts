import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEquipmentRepository } from '../../domain/interfaces/equipment.repository.interface';
import { Equipment } from '../../domain/entities/equipment.domain.entity';
import { EquipmentEntity } from './equipment.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class EquipmentRepository implements IEquipmentRepository {
  constructor(
    @InjectRepository(EquipmentEntity, 'master')
    private readonly equipmentRepo: Repository<EquipmentEntity>,
  ) {}

  async create(equipment: Equipment): Promise<Equipment> {
    const entity = this.toEntity(equipment);
    const saved = await this.equipmentRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(equipmentId: string): Promise<Equipment | null> {
    const entity = await this.equipmentRepo.findOne({
      where: { equipmentId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Equipment[]> {
    const entities = await this.equipmentRepo.find({
      where: { isDeleted: false },
      order: { equipmentName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Equipment[]> {
    const entities = await this.equipmentRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { equipmentName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(equipmentId: string, equipment: Equipment): Promise<Equipment> {
    const entity = this.toEntity(equipment);
    await this.equipmentRepo.update({ equipmentId }, entity);
    const updated = await this.findById(equipmentId);
    if (!updated) {
      throw new Error(`Equipment ${equipmentId} not found after update`);
    }
    return updated;
  }

  async softDelete(equipmentId: string): Promise<void> {
    await this.equipmentRepo.update(
      { equipmentId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByEquipmentCode(equipmentCode: string): Promise<Equipment | null> {
    const entity = await this.equipmentRepo.findOne({
      where: { equipmentCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<Equipment[]> {
    const entities = await this.equipmentRepo.find({
      where: { companyId, isDeleted: false },
      order: { equipmentName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findActiveByCompanyId(companyId: string): Promise<Equipment[]> {
    const entities = await this.equipmentRepo.find({
      where: { companyId, status: MasterStatus.ACTIVE, isDeleted: false },
      order: { equipmentName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(equipment: Equipment): EquipmentEntity {
    const entity = new EquipmentEntity();
    entity.equipmentId = equipment.equipmentId;
    entity.companyId = equipment.companyId;
    entity.equipmentCode = equipment.equipmentCode;
    entity.equipmentName = equipment.equipmentName;
    entity.equipmentType = equipment.equipmentType;
    entity.make = equipment.make;
    entity.capacity = equipment.capacity;
    entity.status = equipment.status;
    entity.createdBy = equipment.createdBy;
    entity.createdOn = equipment.createdOn;
    entity.modifiedBy = equipment.modifiedBy;
    entity.modifiedOn = equipment.modifiedOn;
    entity.isDeleted = equipment.isDeleted;
    return entity;
  }

  private toDomain(entity: EquipmentEntity): Equipment {
    return Equipment.reconstitute({
      equipmentId: entity.equipmentId,
      companyId: entity.companyId,
      equipmentCode: entity.equipmentCode,
      equipmentName: entity.equipmentName,
      equipmentType: entity.equipmentType,
      make: entity.make,
      capacity: entity.capacity,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
