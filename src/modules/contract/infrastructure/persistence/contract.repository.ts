import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ContractEntity } from '../transaction/contract.entity';
import { IContractRepository } from '../../domain/interfaces/contract.repository.interface';
import { Contract } from '../../domain/entities/contract.domain.entity';

@Injectable()
export class ContractRepository implements IContractRepository {
  constructor(
    @InjectRepository(ContractEntity, 'transaction')
    private readonly repository: Repository<ContractEntity>,
    @InjectDataSource('transaction')
    private readonly dataSource: DataSource,
  ) {}

  async findAll(companyId?: string, status?: string): Promise<Contract[]> {
    const query = this.repository.createQueryBuilder('contract')
      .where('contract.isDeleted = :isDeleted', { isDeleted: false });

    if (companyId) {
      query.andWhere('contract.companyId = :companyId', { companyId });
    }
    if (status) {
      query.andWhere('contract.status = :status', { status });
    }

    const entities = await query.orderBy('contract.createdOn', 'DESC').getMany();
    return entities.map(e => this.toDomain(e));
  }

  async findOne(id: string): Promise<Contract | null> {
    const entity = await this.repository.findOne({
      where: { contractId: id, isDeleted: false },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(contract: Contract): Promise<Contract> {
    const entity = this.toEntity(contract);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(contract: Contract): Promise<Contract> {
    const entity = this.toEntity(contract);
    await this.repository.update(contract.contractId, entity);
    const updated = await this.findOne(contract.contractId);
    if (!updated) {
      throw new Error('Contract not found after update');
    }
    return updated;
  }

  async delete(id: string, modifiedBy?: string | null): Promise<void> {
    await this.repository.update(id, { 
      isDeleted: true,
      modifiedBy: modifiedBy || null,
      modifiedOn: new Date(),
    });
  }

  private toDomain(entity: ContractEntity): Contract {
    return Contract.reconstitute({
      contractId: entity.contractId,
      contractID: entity.contractID,
      contractNum: entity.contractNum,
      companyId: entity.companyId,
      hcfId: entity.hcfId,
      agreementTemplateId: entity.agreementTemplateId,
      startDate: entity.startDate,
      endDate: entity.endDate,
      billingType: entity.billingType,
      status: entity.status,
      createdBy: entity.createdBy,
      createdOn: entity.createdOn,
      modifiedBy: entity.modifiedBy,
      modifiedOn: entity.modifiedOn,
      isDeleted: entity.isDeleted,
    });
  }

  private toEntity(contract: Contract): Partial<ContractEntity> {
    return {
      contractId: contract.contractId,
      contractID: contract.contractID,
      contractNum: contract.contractNum,
      companyId: contract.companyId,
      hcfId: contract.hcfId,
      agreementTemplateId: contract.agreementTemplateId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      billingType: contract.billingType,
      status: contract.status,
      createdBy: contract.createdBy,
      createdOn: contract.createdOn,
      modifiedBy: contract.modifiedBy,
      modifiedOn: contract.modifiedOn,
      isDeleted: contract.isDeleted,
    };
  }
}
