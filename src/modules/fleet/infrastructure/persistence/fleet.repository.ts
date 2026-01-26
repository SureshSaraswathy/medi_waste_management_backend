import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IFleetRepository, FLEET_REPOSITORY_TOKEN } from '../../domain/interfaces/fleet.repository.interface';
import { Fleet } from '../../domain/entities/fleet.domain.entity';
import { FleetEntity } from './fleet.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class FleetRepository implements IFleetRepository {
  constructor(
    @InjectRepository(FleetEntity, 'master')
    private readonly fleetRepo: Repository<FleetEntity>,
  ) {}

  async create(fleet: Fleet): Promise<Fleet> {
    const entity = this.toEntity(fleet);
    const saved = await this.fleetRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(fleetId: string): Promise<Fleet | null> {
    const entity = await this.fleetRepo.findOne({
      where: { fleetId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Fleet[]> {
    const entities = await this.fleetRepo.find({
      where: { isDeleted: false },
      order: { vehicleNum: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Fleet[]> {
    const entities = await this.fleetRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { vehicleNum: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(fleetId: string, fleet: Fleet): Promise<Fleet> {
    const entity = this.toEntity(fleet);
    await this.fleetRepo.update({ fleetId }, entity);
    const updated = await this.findById(fleetId);
    if (!updated) {
      throw new Error(`Fleet ${fleetId} not found after update`);
    }
    return updated;
  }

  async softDelete(fleetId: string): Promise<void> {
    await this.fleetRepo.update(
      { fleetId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByVehicleNum(vehicleNum: string, companyId: string): Promise<Fleet | null> {
    const entity = await this.fleetRepo.findOne({
      where: { vehicleNum, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Fleet[]> {
    const entities = await this.fleetRepo.find({
      where: { companyId, isDeleted: false },
      order: { vehicleNum: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(fleet: Fleet): FleetEntity {
    const entity = new FleetEntity();
    entity.fleetId = fleet.fleetId;
    entity.vehicleNum = fleet.vehicleNum;
    entity.companyId = fleet.companyId;
    entity.capacity = fleet.capacity;
    entity.vehMake = fleet.vehMake;
    entity.vehModel = fleet.vehModel;
    entity.mfgYear = fleet.mfgYear;
    entity.nextFCDate = fleet.nextFCDate;
    entity.pucDateValidUpto = fleet.pucDateValidUpto;
    entity.insuranceValidUpto = fleet.insuranceValidUpto;
    entity.ownerName = fleet.ownerName;
    entity.ownerContact = fleet.ownerContact;
    entity.ownerEmail = fleet.ownerEmail;
    entity.ownerPAN = fleet.ownerPAN;
    entity.ownerAadhaar = fleet.ownerAadhaar;
    entity.pymtToName = fleet.pymtToName;
    entity.pymtBankName = fleet.pymtBankName;
    entity.pymtAccNum = fleet.pymtAccNum;
    entity.pymtIFSCode = fleet.pymtIFSCode;
    entity.pymtBranch = fleet.pymtBranch;
    entity.contractAmount = fleet.contractAmount;
    entity.tdsExemption = fleet.tdsExemption;
    entity.status = fleet.status;
    entity.createdBy = fleet.createdBy;
    entity.createdOn = fleet.createdOn;
    entity.modifiedBy = fleet.modifiedBy;
    entity.modifiedOn = fleet.modifiedOn;
    entity.isDeleted = fleet.isDeleted;
    return entity;
  }

  private toDomain(entity: FleetEntity): Fleet {
    return Fleet.reconstitute({
      fleetId: entity.fleetId,
      vehicleNum: entity.vehicleNum,
      companyId: entity.companyId,
      capacity: entity.capacity,
      vehMake: entity.vehMake,
      vehModel: entity.vehModel,
      mfgYear: entity.mfgYear,
      nextFCDate: entity.nextFCDate,
      pucDateValidUpto: entity.pucDateValidUpto,
      insuranceValidUpto: entity.insuranceValidUpto,
      ownerName: entity.ownerName,
      ownerContact: entity.ownerContact,
      ownerEmail: entity.ownerEmail,
      ownerPAN: entity.ownerPAN,
      ownerAadhaar: entity.ownerAadhaar,
      pymtToName: entity.pymtToName,
      pymtBankName: entity.pymtBankName,
      pymtAccNum: entity.pymtAccNum,
      pymtIFSCode: entity.pymtIFSCode,
      pymtBranch: entity.pymtBranch,
      contractAmount: entity.contractAmount,
      tdsExemption: entity.tdsExemption,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
