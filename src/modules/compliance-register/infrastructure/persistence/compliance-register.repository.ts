import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ComplianceRegisterEntity } from '../transaction/compliance-register.entity';

@Injectable()
export class ComplianceRegisterRepository {
  constructor(
    @InjectRepository(ComplianceRegisterEntity, 'transaction')
    private readonly complianceRegisterRepo: Repository<ComplianceRegisterEntity>,
  ) {}

  async findAll(filters?: {
    status?: string;
    authority?: string;
    complianceType?: string;
    dateFrom?: string;
    dateTo?: string;
    showExpired?: boolean;
    search?: string;
  }): Promise<ComplianceRegisterEntity[]> {
    const queryBuilder = this.complianceRegisterRepo
      .createQueryBuilder('cr')
      .where('cr.is_deleted = :isDeleted', { isDeleted: false });

    if (filters?.status) {
      queryBuilder.andWhere('cr.status = :status', { status: filters.status });
    }

    if (filters?.authority) {
      queryBuilder.andWhere('cr.authority LIKE :authority', {
        authority: `%${filters.authority}%`,
      });
    }

    if (filters?.complianceType) {
      queryBuilder.andWhere('cr.compliance_type LIKE :complianceType', {
        complianceType: `%${filters.complianceType}%`,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('cr.issue_date >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('cr.issue_date <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    if (filters?.showExpired) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('cr.expiry_date < :today', { today });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(cr.compliance_name LIKE :search OR cr.authority LIKE :search OR cr.reference_number LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder
      .orderBy('cr.issue_date', 'DESC')
      .addOrderBy('cr.created_at', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ComplianceRegisterEntity | null> {
    return this.complianceRegisterRepo.findOne({
      where: { id, isDeleted: false },
    });
  }

  async create(data: Partial<ComplianceRegisterEntity>): Promise<ComplianceRegisterEntity> {
    const entity = this.complianceRegisterRepo.create(data);
    return this.complianceRegisterRepo.save(entity);
  }

  async update(id: string, data: Partial<ComplianceRegisterEntity>): Promise<ComplianceRegisterEntity> {
    await this.complianceRegisterRepo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Compliance register not found after update');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.complianceRegisterRepo.update(
      { id },
      { isDeleted: true, updatedAt: new Date() },
    );
  }
}
