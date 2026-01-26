import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { WasteTransactionEntity, TransactionStatus } from '../transaction/waste-transaction.entity';

@Injectable()
export class WasteTransactionRepository implements IWasteTransactionRepository {
  constructor(
    @InjectRepository(WasteTransactionEntity, 'transaction')
    private readonly wasteTransactionRepo: Repository<WasteTransactionEntity>,
  ) {}

  async create(wasteTransaction: WasteTransaction): Promise<WasteTransaction> {
    const entity = this.toEntity(wasteTransaction);
    const saved = await this.wasteTransactionRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(wasteTransactionId: string): Promise<WasteTransaction | null> {
    const entity = await this.wasteTransactionRepo.findOne({
      where: { wasteTransactionId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { isDeleted: false },
      order: { pickupDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { companyId, isDeleted: false },
      order: { pickupDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcf(hcfId: string): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { hcfId, isDeleted: false },
      order: { pickupDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo
      .createQueryBuilder('wt')
      .where('wt.pickup_date >= :startDate', { startDate })
      .andWhere('wt.pickup_date <= :endDate', { endDate })
      .andWhere('wt.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('wt.pickup_date', 'DESC')
      .addOrderBy('wt.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(status: TransactionStatus): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { status, isDeleted: false },
      order: { pickupDate: 'DESC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompanyAndDate(companyId: string, pickupDate: Date): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { companyId, pickupDate, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcfAndDate(hcfId: string, pickupDate: Date): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo.find({
      where: { hcfId, pickupDate, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findVerifiedTransactionsByHcfAndDateRange(hcfId: string, startDate: Date, endDate: Date): Promise<WasteTransaction[]> {
    const entities = await this.wasteTransactionRepo
      .createQueryBuilder('wt')
      .where('wt.hcf_id = :hcfId', { hcfId })
      .andWhere('wt.pickup_date >= :startDate', { startDate })
      .andWhere('wt.pickup_date <= :endDate', { endDate })
      .andWhere('wt.status = :status', { status: TransactionStatus.VERIFIED })
      .andWhere('wt.is_deleted = :isDeleted', { isDeleted: false })
      .orderBy('wt.pickup_date', 'DESC')
      .addOrderBy('wt.created_on', 'DESC')
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async update(wasteTransaction: WasteTransaction): Promise<WasteTransaction> {
    const entity = this.toEntity(wasteTransaction);
    const saved = await this.wasteTransactionRepo.save(entity);
    return this.toDomain(saved);
  }

  async softDelete(wasteTransactionId: string): Promise<void> {
    await this.wasteTransactionRepo.update(
      { wasteTransactionId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(wasteTransaction: WasteTransaction): WasteTransactionEntity {
    const entity = new WasteTransactionEntity();
    entity.wasteTransactionId = wasteTransaction.wasteTransactionId;
    entity.companyId = wasteTransaction.companyId;
    entity.hcfId = wasteTransaction.hcfId;
    entity.pickupDate = wasteTransaction.pickupDate;
    entity.isNilPickup = wasteTransaction.isNilPickup;
    entity.yellowBagCount = wasteTransaction.yellowBagCount;
    entity.redBagCount = wasteTransaction.redBagCount;
    entity.whiteBagCount = wasteTransaction.whiteBagCount;
    entity.blueBagCount = wasteTransaction.blueBagCount;
    entity.yellowWeightKg = wasteTransaction.yellowWeightKg;
    entity.redWeightKg = wasteTransaction.redWeightKg;
    entity.whiteWeightKg = wasteTransaction.whiteWeightKg;
    entity.blueWeightKg = wasteTransaction.blueWeightKg;
    entity.latitude = wasteTransaction.latitude;
    entity.longitude = wasteTransaction.longitude;
    entity.segregationQuality = wasteTransaction.segregationQuality;
    entity.status = wasteTransaction.status;
    entity.notes = wasteTransaction.notes;
    entity.createdBy = wasteTransaction.createdBy;
    entity.createdOn = wasteTransaction.createdOn;
    entity.modifiedBy = wasteTransaction.modifiedBy;
    entity.modifiedOn = wasteTransaction.modifiedOn;
    entity.verifiedBy = wasteTransaction.verifiedBy;
    entity.verifiedOn = wasteTransaction.verifiedOn;
    entity.isDeleted = wasteTransaction.isDeleted;
    return entity;
  }

  private toDomain(entity: WasteTransactionEntity): WasteTransaction {
    return WasteTransaction.reconstitute({
      wasteTransactionId: entity.wasteTransactionId,
      companyId: entity.companyId,
      hcfId: entity.hcfId,
      pickupDate: entity.pickupDate,
      isNilPickup: entity.isNilPickup,
      yellowBagCount: entity.yellowBagCount,
      redBagCount: entity.redBagCount,
      whiteBagCount: entity.whiteBagCount,
      blueBagCount: entity.blueBagCount,
      yellowWeightKg: entity.yellowWeightKg,
      redWeightKg: entity.redWeightKg,
      whiteWeightKg: entity.whiteWeightKg,
      blueWeightKg: entity.blueWeightKg,
      latitude: entity.latitude,
      longitude: entity.longitude,
      segregationQuality: entity.segregationQuality,
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
