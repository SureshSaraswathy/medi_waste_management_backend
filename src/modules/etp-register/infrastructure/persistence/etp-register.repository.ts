import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ETPRegisterEntity } from '../transaction/etp-register.entity';

@Injectable()
export class ETPRegisterRepository {
  constructor(
    @InjectRepository(ETPRegisterEntity, 'transaction')
    private readonly etpRegisterRepo: Repository<ETPRegisterEntity>,
  ) {}

  async findAll(): Promise<ETPRegisterEntity[]> {
    return this.etpRegisterRepo.find({
      where: { isDeleted: false },
      order: { date: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(etpId: string): Promise<ETPRegisterEntity | null> {
    return this.etpRegisterRepo.findOne({
      where: { etpId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<ETPRegisterEntity[]> {
    return this.etpRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { date: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<ETPRegisterEntity[]> {
    return this.etpRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { date: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByEtpRegNum(etpRegNum: string): Promise<ETPRegisterEntity | null> {
    return this.etpRegisterRepo.findOne({
      where: { etpRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<ETPRegisterEntity>): Promise<ETPRegisterEntity> {
    const entity = this.etpRegisterRepo.create(data);
    return this.etpRegisterRepo.save(entity);
  }

  async update(etpId: string, data: Partial<ETPRegisterEntity>): Promise<ETPRegisterEntity> {
    await this.etpRegisterRepo.update(etpId, data);
    const updated = await this.findById(etpId);
    if (!updated) {
      throw new Error('ETP register not found after update');
    }
    return updated;
  }

  async softDelete(etpId: string): Promise<void> {
    await this.etpRegisterRepo.update(
      { etpId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
