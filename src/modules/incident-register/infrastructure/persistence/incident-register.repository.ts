import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentRegisterEntity } from '../transaction/incident-register.entity';

@Injectable()
export class IncidentRegisterRepository {
  constructor(
    @InjectRepository(IncidentRegisterEntity, 'transaction')
    private readonly incidentRegisterRepo: Repository<IncidentRegisterEntity>,
  ) {}

  async findAll(): Promise<IncidentRegisterEntity[]> {
    return this.incidentRegisterRepo.find({
      where: { isDeleted: false },
      order: { incidentDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findById(incidentId: string): Promise<IncidentRegisterEntity | null> {
    return this.incidentRegisterRepo.findOne({
      where: { incidentId, isDeleted: false },
    });
  }

  async findByCompany(companyId: string): Promise<IncidentRegisterEntity[]> {
    return this.incidentRegisterRepo.find({
      where: { companyId, isDeleted: false },
      order: { incidentDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<IncidentRegisterEntity[]> {
    return this.incidentRegisterRepo.find({
      where: { status: status as 'Active' | 'Inactive', isDeleted: false },
      order: { incidentDate: 'DESC', createdOn: 'DESC' },
    });
  }

  async findByIncidentNum(incidentNum: string): Promise<IncidentRegisterEntity | null> {
    return this.incidentRegisterRepo.findOne({
      where: { incidentNum, isDeleted: false },
    });
  }

  async create(data: Partial<IncidentRegisterEntity>): Promise<IncidentRegisterEntity> {
    const entity = this.incidentRegisterRepo.create(data);
    return this.incidentRegisterRepo.save(entity);
  }

  async update(incidentId: string, data: Partial<IncidentRegisterEntity>): Promise<IncidentRegisterEntity> {
    await this.incidentRegisterRepo.update(incidentId, data);
    const updated = await this.findById(incidentId);
    if (!updated) {
      throw new Error('Incident register not found after update');
    }
    return updated;
  }

  async softDelete(incidentId: string): Promise<void> {
    await this.incidentRegisterRepo.update(
      { incidentId },
      { isDeleted: true, modifiedOn: new Date() },
    );
  }
}
