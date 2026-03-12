import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAgreementTemplateRepository, AGREEMENT_TEMPLATE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-template.repository.interface';
import { AgreementTemplate } from '../../domain/entities/agreement-template.domain.entity';
import { AgreementTemplateEntity } from './agreement-template.entity';
import { MasterStatus } from '../../../../common/base/master-data.base.entity';

@Injectable()
export class AgreementTemplateRepository implements IAgreementTemplateRepository {
  constructor(
    @InjectRepository(AgreementTemplateEntity, 'master')
    private readonly templateRepo: Repository<AgreementTemplateEntity>,
  ) {}

  async create(template: AgreementTemplate): Promise<AgreementTemplate> {
    const entity = this.toEntity(template);
    const saved = await this.templateRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(templateId: string): Promise<AgreementTemplate | null> {
    const entity = await this.templateRepo.findOne({
      where: { templateId, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<AgreementTemplate[]> {
    const entities = await this.templateRepo.find({
      where: { isDeleted: false },
      order: { templateName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllActive(): Promise<AgreementTemplate[]> {
    const entities = await this.templateRepo.find({
      where: { status: MasterStatus.ACTIVE, isDeleted: false },
      order: { templateName: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(templateId: string, template: AgreementTemplate): Promise<AgreementTemplate> {
    const entity = this.toEntity(template);
    await this.templateRepo.update({ templateId }, entity);
    const updated = await this.findById(templateId);
    if (!updated) {
      throw new Error(`Agreement template ${templateId} not found after update`);
    }
    return updated;
  }

  async softDelete(templateId: string): Promise<void> {
    await this.templateRepo.update(
      { templateId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }

  async findByTemplateCode(templateCode: string): Promise<AgreementTemplate | null> {
    const entity = await this.templateRepo.findOne({
      where: { templateCode, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findLastTemplateCode(): Promise<string | null> {
    const entity = await this.templateRepo.findOne({
      where: { isDeleted: false },
      order: { templateCode: 'DESC' },
    });
    return entity ? entity.templateCode : null;
  }

  private toEntity(template: AgreementTemplate): AgreementTemplateEntity {
    const entity = new AgreementTemplateEntity();
    entity.templateId = template.templateId;
    entity.templateCode = template.templateCode;
    entity.templateName = template.templateName;
    entity.agreementCategory = template.agreementCategory;
    entity.templateDescription = template.templateDescription;
    entity.templateContent = template.templateContent;
    entity.status = template.status;
    entity.createdBy = template.createdBy;
    entity.createdOn = template.createdOn;
    entity.modifiedBy = template.modifiedBy;
    entity.modifiedOn = template.modifiedOn;
    entity.isDeleted = template.isDeleted;
    return entity;
  }

  private toDomain(entity: AgreementTemplateEntity): AgreementTemplate {
    return AgreementTemplate.reconstitute({
      templateId: entity.templateId,
      templateCode: entity.templateCode,
      templateName: entity.templateName,
      agreementCategory: entity.agreementCategory,
      templateDescription: entity.templateDescription,
      templateContent: entity.templateContent,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }
}
