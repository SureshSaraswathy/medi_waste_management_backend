import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DowntimeRegisterEntity } from '../transaction/downtime-register.entity';

@Injectable()
export class DowntimeRegisterRepository {
  constructor(
    @InjectRepository(DowntimeRegisterEntity, 'transaction')
    private readonly downtimeRegisterRepo: Repository<DowntimeRegisterEntity>,
  ) {}

  async findAll(): Promise<DowntimeRegisterEntity[]> {
    return this.downtimeRegisterRepo.find({
      where: { isDeleted: false },
      order: { breakdownDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(downtimeId: string): Promise<DowntimeRegisterEntity | null> {
    return this.downtimeRegisterRepo.findOne({
      where: { id: downtimeId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<DowntimeRegisterEntity[]> {
    return this.downtimeRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { breakdownDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<DowntimeRegisterEntity[]> {
    return this.downtimeRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { breakdownDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByDtRegNum(dtRegNum: string): Promise<DowntimeRegisterEntity | null> {
    return this.downtimeRegisterRepo.findOne({
      where: { dtRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<DowntimeRegisterEntity>): Promise<DowntimeRegisterEntity> {
    const entity = this.downtimeRegisterRepo.create(data);
    return this.downtimeRegisterRepo.save(entity);
  }

  async update(downtimeId: string, data: Partial<DowntimeRegisterEntity>): Promise<DowntimeRegisterEntity> {
    await this.downtimeRegisterRepo.update(downtimeId, data);
    const updated = await this.findById(downtimeId);
    if (!updated) {
      throw new Error('Downtime register not found after update');
    }
    return updated;
  }

  async softDelete(downtimeId: string): Promise<void> {
    await this.downtimeRegisterRepo.update(
      { id: downtimeId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
