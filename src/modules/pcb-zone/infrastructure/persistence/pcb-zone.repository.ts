import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPcbZoneRepository } from '../../domain/interfaces/pcb-zone.repository.interface';
import { PcbZone } from '../../domain/entities/pcb-zone.domain.entity';
import { PcbZoneEntity } from './pcb-zone.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class PcbZoneRepository implements IPcbZoneRepository {
  constructor(
    @InjectRepository(PcbZoneEntity, 'master')
    private readonly pcbZoneRepo: Repository<PcbZoneEntity>,
  ) {}

  async create(pcbZone: PcbZone): Promise<PcbZone> {
    const entity = this.toEntity(pcbZone);
    const saved = await this.pcbZoneRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(pcbZoneId: string): Promise<PcbZone | null> {
    const entity = await this.pcbZoneRepo.findOne({
      where: { pcbZoneId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<PcbZone[]> {
    const entities = await this.pcbZoneRepo.find({
      where: { isDeleted: false },
      order: { pcbZoneName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<PcbZone[]> {
    const entities = await this.pcbZoneRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { pcbZoneName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(pcbZoneId: string, pcbZone: PcbZone): Promise<PcbZone> {
    const entity = this.toEntity(pcbZone);
    await this.pcbZoneRepo.update({ pcbZoneId }, entity);
    const updated = await this.findById(pcbZoneId);
    if (!updated) {
      throw new Error(`PcbZone ${pcbZoneId} not found after update`);
    }
    return updated;
  }

  async softDelete(pcbZoneId: string): Promise<void> {
    await this.pcbZoneRepo.update(
      { pcbZoneId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByPcbZoneName(pcbZoneName: string): Promise<PcbZone | null> {
    const entity = await this.pcbZoneRepo.findOne({
      where: { pcbZoneName, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(pcbZone: PcbZone): PcbZoneEntity {
    const entity = new PcbZoneEntity();
    entity.pcbZoneId = pcbZone.pcbZoneId;
    entity.pcbZoneName = pcbZone.pcbZoneName;
    entity.pcbZoneAddress = pcbZone.pcbZoneAddress || null;
    entity.contactNum = pcbZone.contactNum || null;
    entity.contactEmail = pcbZone.contactEmail || null;
    entity.alertEmail = pcbZone.alertEmail || null;
    entity.status = pcbZone.status;
    entity.createdBy = pcbZone.createdBy;
    entity.createdOn = pcbZone.createdOn;
    entity.modifiedBy = pcbZone.modifiedBy;
    entity.modifiedOn = pcbZone.modifiedOn;
    entity.isDeleted = pcbZone.isDeleted;
    return entity;
  }

  private toDomain(entity: PcbZoneEntity): PcbZone {
    return PcbZone.reconstitute({
      pcbZoneId: entity.pcbZoneId,
      pcbZoneName: entity.pcbZoneName,
      pcbZoneAddress: entity.pcbZoneAddress || '',
      contactNum: entity.contactNum || '',
      contactEmail: entity.contactEmail || '',
      alertEmail: entity.alertEmail || '',
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
