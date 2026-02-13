import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisposalRegisterEntity } from '../transaction/disposal-register.entity';

@Injectable()
export class DisposalRegisterRepository {
  constructor(
    @InjectRepository(DisposalRegisterEntity, 'transaction')
    private readonly disposalRegisterRepo: Repository<DisposalRegisterEntity>,
  ) {}

  async findAll(): Promise<DisposalRegisterEntity[]> {
    return this.disposalRegisterRepo.find({
      where: { isDeleted: false },
      order: { disposalDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(disposalId: string): Promise<DisposalRegisterEntity | null> {
    return this.disposalRegisterRepo.findOne({
      where: { disposalId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<DisposalRegisterEntity[]> {
    return this.disposalRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { disposalDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<DisposalRegisterEntity[]> {
    return this.disposalRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { disposalDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByDispoRegNum(dispoRegNum: string): Promise<DisposalRegisterEntity | null> {
    return this.disposalRegisterRepo.findOne({
      where: { dispoRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<DisposalRegisterEntity>): Promise<DisposalRegisterEntity> {
    const entity = this.disposalRegisterRepo.create(data);
    return this.disposalRegisterRepo.save(entity);
  }

  async update(disposalId: string, data: Partial<DisposalRegisterEntity>): Promise<DisposalRegisterEntity> {
    await this.disposalRegisterRepo.update(disposalId, data);
    const updated = await this.findById(disposalId);
    if (!updated) {
      throw new Error('Disposal register not found after update');
    }
    return updated;
  }

  async softDelete(disposalId: string): Promise<void> {
    await this.disposalRegisterRepo.update(
      { disposalId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
