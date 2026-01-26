import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';
import { BarcodeLabelEntity, BarcodeType } from '../transaction/barcode-label.entity';

@Injectable()
export class BarcodeLabelRepository implements IBarcodeLabelRepository {
  constructor(
    @InjectRepository(BarcodeLabelEntity, 'transaction')
    private readonly barcodeLabelRepo: Repository<BarcodeLabelEntity>,
  ) {}

  async create(barcodeLabel: BarcodeLabel): Promise<BarcodeLabel> {
    const entity = this.toEntity(barcodeLabel);
    const saved = await this.barcodeLabelRepo.save(entity);
    return this.toDomain(saved);
  }

  async createMany(barcodeLabels: BarcodeLabel[]): Promise<BarcodeLabel[]> {
    const entities = barcodeLabels.map(label => this.toEntity(label));
    const saved = await this.barcodeLabelRepo.save(entities);
    return saved.map(entity => this.toDomain(entity));
  }

  async findById(barcodeLabelId: string): Promise<BarcodeLabel | null> {
    const entity = await this.barcodeLabelRepo.findOne({
      where: { barcodeLabelId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByBarcodeValue(barcodeValue: string): Promise<BarcodeLabel | null> {
    const entity = await this.barcodeLabelRepo.findOne({
      where: { barcodeValue, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<BarcodeLabel[]> {
    const entities = await this.barcodeLabelRepo.find({
      where: { isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcf(hcfId: string): Promise<BarcodeLabel[]> {
    const entities = await this.barcodeLabelRepo.find({
      where: { hcfId, isDeleted: false },
      order: { sequenceNumber: 'ASC', createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCompany(companyId: string): Promise<BarcodeLabel[]> {
    const entities = await this.barcodeLabelRepo.find({
      where: { companyId, isDeleted: false },
      order: { createdOn: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByHcfCodeAndType(hcfCode: string, barcodeType: BarcodeType): Promise<BarcodeLabel[]> {
    const entities = await this.barcodeLabelRepo.find({
      where: { hcfCode, barcodeType, isDeleted: false },
      order: { sequenceNumber: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async getLastSequenceNumber(hcfCode: string, barcodeType: BarcodeType): Promise<number> {
    const entity = await this.barcodeLabelRepo.findOne({
      where: { hcfCode, barcodeType, isDeleted: false },
      order: { sequenceNumber: 'DESC' },
    });
    return entity ? entity.sequenceNumber : 0;
  }

  async softDelete(barcodeLabelId: string): Promise<void> {
    await this.barcodeLabelRepo.update(
      { barcodeLabelId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  private toEntity(barcodeLabel: BarcodeLabel): BarcodeLabelEntity {
    const entity = new BarcodeLabelEntity();
    entity.barcodeLabelId = barcodeLabel.barcodeLabelId;
    entity.hcfCode = barcodeLabel.hcfCode;
    entity.hcfId = barcodeLabel.hcfId;
    entity.companyId = barcodeLabel.companyId;
    entity.sequenceNumber = barcodeLabel.sequenceNumber;
    entity.barcodeValue = barcodeLabel.barcodeValue;
    entity.barcodeType = barcodeLabel.barcodeType;
    entity.colorBlock = barcodeLabel.colorBlock;
    entity.createdBy = barcodeLabel.createdBy;
    entity.createdOn = barcodeLabel.createdOn;
    entity.modifiedBy = barcodeLabel.modifiedBy;
    entity.modifiedOn = barcodeLabel.modifiedOn;
    entity.isDeleted = barcodeLabel.isDeleted;
    return entity;
  }

  private toDomain(entity: BarcodeLabelEntity): BarcodeLabel {
    return BarcodeLabel.reconstitute({
      barcodeLabelId: entity.barcodeLabelId,
      hcfCode: entity.hcfCode,
      hcfId: entity.hcfId,
      companyId: entity.companyId,
      sequenceNumber: entity.sequenceNumber,
      barcodeValue: entity.barcodeValue,
      barcodeType: entity.barcodeType,
      colorBlock: entity.colorBlock,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
