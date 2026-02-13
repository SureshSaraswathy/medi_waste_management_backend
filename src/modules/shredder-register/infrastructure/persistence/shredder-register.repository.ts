import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShredderRegisterEntity } from '../transaction/shredder-register.entity';

@Injectable()
export class ShredderRegisterRepository {
  constructor(
    @InjectRepository(ShredderRegisterEntity, 'transaction')
    private readonly shredderRegisterRepo: Repository<ShredderRegisterEntity>,
  ) {}

  async findAll(): Promise<ShredderRegisterEntity[]> {
    return this.shredderRegisterRepo.find({
      where: { isDeleted: false },
      order: { shredderDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(shredderId: string): Promise<ShredderRegisterEntity | null> {
    return this.shredderRegisterRepo.findOne({
      where: { shredderId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<ShredderRegisterEntity[]> {
    return this.shredderRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { shredderDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<ShredderRegisterEntity[]> {
    return this.shredderRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { shredderDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByShredRegNum(shredRegNum: string): Promise<ShredderRegisterEntity | null> {
    return this.shredderRegisterRepo.findOne({
      where: { shredRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<ShredderRegisterEntity>): Promise<ShredderRegisterEntity> {
    const entity = this.shredderRegisterRepo.create(data);
    return this.shredderRegisterRepo.save(entity);
  }

  async update(shredderId: string, data: Partial<ShredderRegisterEntity>): Promise<ShredderRegisterEntity> {
    await this.shredderRegisterRepo.update(shredderId, data);
    const updated = await this.findById(shredderId);
    if (!updated) {
      throw new Error('Shredder register not found after update');
    }
    return updated;
  }

  async softDelete(shredderId: string): Promise<void> {
    await this.shredderRegisterRepo.update(
      { shredderId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
