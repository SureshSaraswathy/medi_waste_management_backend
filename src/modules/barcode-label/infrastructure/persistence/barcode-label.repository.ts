import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBarcodeLabelRepository, BARCODE_LABEL_REPOSITORY_TOKEN } from '../../domain/interfaces/barcode-label.repository.interface';
import { BarcodeLabel } from '../../domain/entities/barcode-label.domain.entity';
import { BarcodeLabelEntity, BarcodeType, BarcodeStatus } from '../transaction/barcode-label.entity';

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

  async getLastSequenceNumber(): Promise<number> {
    // Global sequence - get the highest sequence number across all barcodes
    const entity = await this.barcodeLabelRepo.findOne({
      where: { isDeleted: false },
      order: { sequenceNumber: 'DESC' },
    });
    return entity ? entity.sequenceNumber : 0;
  }

  async update(barcodeLabel: BarcodeLabel): Promise<BarcodeLabel> {
    const entity = await this.barcodeLabelRepo.findOne({
      where: { barcodeLabelId: barcodeLabel.barcodeLabelId },
    });
    if (!entity) {
      throw new Error('Barcode label not found');
    }
    if ((barcodeLabel as any).colorBlock !== undefined) {
      entity.colorBlock = (barcodeLabel as any).colorBlock;
    }
    if ((barcodeLabel as any).status !== undefined) {
      entity.status = (barcodeLabel as any).status;
    }
    entity.modifiedBy = barcodeLabel.modifiedBy;
    entity.modifiedOn = barcodeLabel.modifiedOn;
    const saved = await this.barcodeLabelRepo.save(entity);
    return this.toDomain(saved);
  }

  async findWithPagination(params: {
    page: number;
    limit: number;
    search?: string;
    colorBlock?: string;
    barcodeType?: BarcodeType;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    includeDeleted?: boolean;
  }): Promise<{ data: BarcodeLabel[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.barcodeLabelRepo.createQueryBuilder('label');

    // Select only required columns for better performance
    queryBuilder.select([
      'label.barcodeLabelId',
      'label.barcodeValue',
      'label.hcfCode',
      'label.hcfId',
      'label.companyId',
      'label.colorBlock',
      'label.barcodeType',
      'label.status',
      'label.createdOn',
    ]);

    // Filter by deleted status
    if (!params.includeDeleted) {
      queryBuilder.andWhere('label.isDeleted = :isDeleted', { isDeleted: false });
      if (params.status !== 'Deleted') {
        queryBuilder.andWhere('label.status != :deletedStatus', { deletedStatus: 'Deleted' });
      }
    }

    // Search filter
    if (params.search) {
      queryBuilder.andWhere(
        '(label.barcodeValue ILIKE :search OR label.hcfCode ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }

    // Color block filter
    if (params.colorBlock) {
      queryBuilder.andWhere('label.colorBlock = :colorBlock', { colorBlock: params.colorBlock });
    }

    // Barcode type filter
    if (params.barcodeType) {
      queryBuilder.andWhere('label.barcodeType = :barcodeType', { barcodeType: params.barcodeType });
    }

    // Status filter
    if (params.status) {
      queryBuilder.andWhere('label.status = :status', { status: params.status });
    }

    // Date range filter
    if (params.startDate) {
      queryBuilder.andWhere('label.createdOn >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere('label.createdOn <= :endDate', { endDate: params.endDate });
    }

    // Get total count (before pagination - optimized)
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (params.page - 1) * params.limit;
    queryBuilder.skip(skip).take(params.limit);
    queryBuilder.orderBy('label.createdOn', 'DESC');

    // Execute query - get only selected columns
    const entities = await queryBuilder.getMany();
    
    return {
      data: entities.map((e) => this.toDomain(e)),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  async getTotalCounts(): Promise<{ total: number; barcodes: number; qrCodes: number; collected: number; deactivated: number }> {
    // Use a single aggregate query for better performance
    const result = await this.barcodeLabelRepo
      .createQueryBuilder('label')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN label.barcodeType = :barcodeType THEN 1 ELSE 0 END)', 'barcodes')
      .addSelect('SUM(CASE WHEN label.barcodeType = :qrCodeType THEN 1 ELSE 0 END)', 'qrCodes')
      .addSelect('SUM(CASE WHEN label.status = :collectedStatus THEN 1 ELSE 0 END)', 'collected')
      .addSelect('SUM(CASE WHEN label.status = :inactiveStatus THEN 1 ELSE 0 END)', 'deactivated')
      .where('label.isDeleted = :isDeleted', { isDeleted: false })
      .setParameters({
        barcodeType: BarcodeType.BARCODE,
        qrCodeType: BarcodeType.QR_CODE,
        collectedStatus: BarcodeStatus.COLLECTED,
        inactiveStatus: BarcodeStatus.INACTIVE,
      })
      .getRawOne();

    return {
      total: parseInt(result?.total || '0', 10),
      barcodes: parseInt(result?.barcodes || '0', 10),
      qrCodes: parseInt(result?.qrCodes || '0', 10),
      collected: parseInt(result?.collected || '0', 10),
      deactivated: parseInt(result?.deactivated || '0', 10),
    };
  }

  async softDelete(barcodeLabelId: string): Promise<void> {
    await this.barcodeLabelRepo.update(
      { barcodeLabelId },
      { isDeleted: true, status: BarcodeStatus.DELETED, modifiedOn: new Date() },
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
    entity.status = (barcodeLabel as any).status || BarcodeStatus.ACTIVE;
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
      status: entity.status || BarcodeStatus.ACTIVE,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
