import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IColorRepository } from '../../domain/interfaces/color.repository.interface';
import { Color } from '../../domain/entities/color.domain.entity';
import { ColorEntity } from './color.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class ColorRepository implements IColorRepository {
  constructor(
    @InjectRepository(ColorEntity, 'master')
    private readonly colorRepo: Repository<ColorEntity>,
  ) {}

  async create(color: Color): Promise<Color> {
    const entity = this.toEntity(color);
    const saved = await this.colorRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(colorId: string): Promise<Color | null> {
    const entity = await this.colorRepo.findOne({
      where: { colorId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Color[]> {
    const entities = await this.colorRepo.find({
      where: { isDeleted: false },
      order: { colorName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<Color[]> {
    const entities = await this.colorRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { colorName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(colorId: string, color: Color): Promise<Color> {
    const entity = this.toEntity(color);
    await this.colorRepo.update({ colorId }, entity);
    const updated = await this.findById(colorId);
    if (!updated) {
      throw new Error(`Color ${colorId} not found after update`);
    }
    return updated;
  }

  async softDelete(colorId: string): Promise<void> {
    await this.colorRepo.update(
      { colorId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByColorNameAndCompany(colorName: string, companyId: string): Promise<Color | null> {
    const entity = await this.colorRepo.findOne({
      where: { colorName, companyId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompany(companyId: string): Promise<Color[]> {
    const entities = await this.colorRepo.find({
      where: { companyId, isDeleted: false },
      order: { colorName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(color: Color): ColorEntity {
    const entity = new ColorEntity();
    entity.colorId = color.colorId;
    entity.colorName = color.colorName;
    entity.companyId = color.companyId;
    entity.status = color.status;
    entity.createdBy = color.createdBy;
    entity.createdOn = color.createdOn;
    entity.modifiedBy = color.modifiedBy;
    entity.modifiedOn = color.modifiedOn;
    entity.isDeleted = color.isDeleted;
    return entity;
  }

  private toDomain(entity: ColorEntity): Color {
    return Color.reconstitute({
      colorId: entity.colorId,
      colorName: entity.colorName,
      companyId: entity.companyId,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
