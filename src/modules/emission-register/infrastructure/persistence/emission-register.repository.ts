import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmissionRegisterEntity } from '../transaction/emission-register.entity';

@Injectable()
export class EmissionRegisterRepository {
  constructor(
    @InjectRepository(EmissionRegisterEntity, 'transaction')
    private readonly emissionRegisterRepo: Repository<EmissionRegisterEntity>,
  ) {}

  async findAll(): Promise<EmissionRegisterEntity[]> {
    return this.emissionRegisterRepo.find({
      where: { isDeleted: false },
      order: { emissionDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(emissionId: string): Promise<EmissionRegisterEntity | null> {
    return this.emissionRegisterRepo.findOne({
      where: { emissionId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<EmissionRegisterEntity[]> {
    return this.emissionRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { emissionDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<EmissionRegisterEntity[]> {
    return this.emissionRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { emissionDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByEmisRegNum(emisRegNum: string): Promise<EmissionRegisterEntity | null> {
    return this.emissionRegisterRepo.findOne({
      where: { emisRegNum, isDeleted: false },
    });
  }

  async create(data: Partial<EmissionRegisterEntity>): Promise<EmissionRegisterEntity> {
    const entity = this.emissionRegisterRepo.create(data);
    return this.emissionRegisterRepo.save(entity);
  }

  async update(emissionId: string, data: Partial<EmissionRegisterEntity>): Promise<EmissionRegisterEntity> {
    await this.emissionRegisterRepo.update(emissionId, data);
    const updated = await this.findById(emissionId);
    if (!updated) {
      throw new Error('Emission register not found after update');
    }
    return updated;
  }

  async softDelete(emissionId: string): Promise<void> {
    await this.emissionRegisterRepo.update(
      { emissionId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
