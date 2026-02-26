import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplianceRegisterRepository } from './infrastructure/persistence/compliance-register.repository';
import { CreateComplianceRegisterDto } from './application/dto/create-compliance-register.dto';
import { UpdateComplianceRegisterDto } from './application/dto/update-compliance-register.dto';
import { ComplianceRegisterEntity } from './infrastructure/transaction/compliance-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ComplianceRegisterService {
  constructor(private readonly repository: ComplianceRegisterRepository) {}

  async findAll(filters?: {
    status?: string;
    authority?: string;
    complianceType?: string;
    dateFrom?: string;
    dateTo?: string;
    showExpired?: boolean;
    search?: string;
  }): Promise<ComplianceRegisterEntity[]> {
    return this.repository.findAll(filters);
  }

  async findOne(id: string): Promise<ComplianceRegisterEntity> {
    const compliance = await this.repository.findById(id);
    if (!compliance) {
      throw new NotFoundException(`Compliance register with ID ${id} not found`);
    }
    return compliance;
  }

  async create(createDto: CreateComplianceRegisterDto, userId?: string): Promise<ComplianceRegisterEntity> {
    const complianceData: Partial<ComplianceRegisterEntity> = {
      id: uuidv4(),
      complianceName: createDto.complianceName,
      complianceType: createDto.complianceType,
      authority: createDto.authority,
      referenceNumber: createDto.referenceNumber || null,
      issueDate: new Date(createDto.issueDate),
      expiryDate: createDto.expiryDate ? new Date(createDto.expiryDate) : null,
      reminderDays: createDto.reminderDays || null,
      status: createDto.status || 'Draft',
      documentUrl: createDto.documentUrl || null,
      remarks: createDto.remarks || null,
      createdBy: userId || null,
    };

    return this.repository.create(complianceData);
  }

  async update(id: string, updateDto: UpdateComplianceRegisterDto, userId?: string): Promise<ComplianceRegisterEntity> {
    await this.findOne(id); // Validate existence

    const updateData: Partial<ComplianceRegisterEntity> = {};

    if (updateDto.complianceName !== undefined) {
      updateData.complianceName = updateDto.complianceName;
    }
    if (updateDto.complianceType !== undefined) {
      updateData.complianceType = updateDto.complianceType;
    }
    if (updateDto.authority !== undefined) {
      updateData.authority = updateDto.authority;
    }
    if (updateDto.referenceNumber !== undefined) {
      updateData.referenceNumber = updateDto.referenceNumber;
    }
    if (updateDto.issueDate !== undefined) {
      updateData.issueDate = new Date(updateDto.issueDate);
    }
    if (updateDto.expiryDate !== undefined) {
      updateData.expiryDate = updateDto.expiryDate ? new Date(updateDto.expiryDate) : null;
    }
    if (updateDto.reminderDays !== undefined) {
      updateData.reminderDays = updateDto.reminderDays;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.documentUrl !== undefined) {
      updateData.documentUrl = updateDto.documentUrl;
    }
    if (updateDto.remarks !== undefined) {
      updateData.remarks = updateDto.remarks;
    }

    return this.repository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Validate existence
    await this.repository.softDelete(id);
  }
}
