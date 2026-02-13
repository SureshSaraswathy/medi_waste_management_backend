import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncinerationRegisterEntity } from '../transaction/incineration-register.entity';

@Injectable()
export class IncinerationRegisterRepository {
  constructor(
    @InjectRepository(IncinerationRegisterEntity, 'transaction')
    private readonly incinerationRegisterRepo: Repository<IncinerationRegisterEntity>,
  ) {}

  async findAll(): Promise<IncinerationRegisterEntity[]> {
    return this.incinerationRegisterRepo.find({
      where: { isDeleted: false },
      order: { incinerationDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(incinerationId: string): Promise<IncinerationRegisterEntity | null> {
    return this.incinerationRegisterRepo.findOne({
      where: { incinerationId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<IncinerationRegisterEntity[]> {
    return this.incinerationRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { incinerationDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<IncinerationRegisterEntity[]> {
    return this.incinerationRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { incinerationDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByInciRegNum(inciRegNum: string): Promise<IncinerationRegisterEntity | null> {
    return this.incinerationRegisterRepo.findOne({
      where: { inciRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<IncinerationRegisterEntity>): Promise<IncinerationRegisterEntity> {
    const entity = this.incinerationRegisterRepo.create(data);
    return this.incinerationRegisterRepo.save(entity);
  }

  async update(incinerationId: string, data: Partial<IncinerationRegisterEntity>): Promise<IncinerationRegisterEntity> {
    await this.incinerationRegisterRepo.update(incinerationId, data);
    const updated = await this.findById(incinerationId);
    if (!updated) {
      throw new Error('Incineration register not found after update');
    }
    return updated;
  }

  async softDelete(incinerationId: string): Promise<void> {
    await this.incinerationRegisterRepo.update(
      { incinerationId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
