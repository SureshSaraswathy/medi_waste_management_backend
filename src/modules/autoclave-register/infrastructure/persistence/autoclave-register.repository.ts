import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoclaveRegisterEntity } from '../transaction/autoclave-register.entity';

@Injectable()
export class AutoclaveRegisterRepository {
  constructor(
    @InjectRepository(AutoclaveRegisterEntity, 'transaction')
    private readonly autoclaveRegisterRepo: Repository<AutoclaveRegisterEntity>,
  ) {}

  async findAll(): Promise<AutoclaveRegisterEntity[]> {
    return this.autoclaveRegisterRepo.find({
      where: { isDeleted: false },
      order: { autoclaveDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(autoclaveId: string): Promise<AutoclaveRegisterEntity | null> {
    return this.autoclaveRegisterRepo.findOne({
      where: { autoclaveId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<AutoclaveRegisterEntity[]> {
    return this.autoclaveRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { autoclaveDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<AutoclaveRegisterEntity[]> {
    return this.autoclaveRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { autoclaveDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByAutoclRegNum(autoclRegNum: string): Promise<AutoclaveRegisterEntity | null> {
    return this.autoclaveRegisterRepo.findOne({
      where: { autoclRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<AutoclaveRegisterEntity>): Promise<AutoclaveRegisterEntity> {
    const entity = this.autoclaveRegisterRepo.create(data);
    return this.autoclaveRegisterRepo.save(entity);
  }

  async update(autoclaveId: string, data: Partial<AutoclaveRegisterEntity>): Promise<AutoclaveRegisterEntity> {
    await this.autoclaveRegisterRepo.update(autoclaveId, data);
    const updated = await this.findById(autoclaveId);
    if (!updated) {
      throw new Error('Autoclave register not found after update');
    }
    return updated;
  }

  async softDelete(autoclaveId: string): Promise<void> {
    await this.autoclaveRegisterRepo.update(
      { autoclaveId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
