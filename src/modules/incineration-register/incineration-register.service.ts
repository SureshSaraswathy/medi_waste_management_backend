import { Injectable, NotFoundException } from '@nestjs/common';
import { IncinerationRegisterRepository } from './infrastructure/persistence/incineration-register.repository';
import { CreateIncinerationRegisterDto } from './application/dto/create-incineration-register.dto';
import { UpdateIncinerationRegisterDto } from './application/dto/update-incineration-register.dto';
import { IncinerationRegisterEntity } from './infrastructure/transaction/incineration-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IncinerationRegisterService {
  constructor(private readonly repository: IncinerationRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<IncinerationRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(incinerationId: string): Promise<IncinerationRegisterEntity> {
    const incineration = await this.repository.findById(incinerationId);
    if (!incineration) {
      throw new NotFoundException(`Incineration register with ID ${incinerationId} not found`);
    }
    return incineration;
  }

  async create(createDto: CreateIncinerationRegisterDto, userId?: string): Promise<IncinerationRegisterEntity> {
    // Generate incineration register number
    const inciRegNum = await this.generateInciRegNum();

    const incinerationData: Partial<IncinerationRegisterEntity> = {
      incinerationId: uuidv4(),
      inciRegNum,
      companyId: createDto.companyId,
      incinerationDate: new Date(createDto.incinerationDate),
      equipmentId: createDto.equipmentId,
      secondaryChamberId: createDto.secondaryChamberId,
      batchNo: createDto.batchNo,
      wasteCategory: createDto.wasteCategory,
      wasteQtyKg: createDto.wasteQtyKg,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      avgTempC: createDto.avgTempC,
      retentionTimeSec: createDto.retentionTimeSec,
      fuelUsedL: createDto.fuelUsedL,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(incinerationData);
  }

  async update(incinerationId: string, updateDto: UpdateIncinerationRegisterDto, userId?: string): Promise<IncinerationRegisterEntity> {
    await this.findOne(incinerationId); // Validate existence

    const updateData: Partial<IncinerationRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.incinerationDate) {
      updateData.incinerationDate = new Date(updateDto.incinerationDate);
    }
    if (updateDto.equipmentId !== undefined) {
      updateData.equipmentId = updateDto.equipmentId;
    }
    if (updateDto.secondaryChamberId !== undefined) {
      updateData.secondaryChamberId = updateDto.secondaryChamberId;
    }
    if (updateDto.batchNo !== undefined) {
      updateData.batchNo = updateDto.batchNo;
    }
    if (updateDto.wasteCategory !== undefined) {
      updateData.wasteCategory = updateDto.wasteCategory;
    }
    if (updateDto.wasteQtyKg !== undefined) {
      updateData.wasteQtyKg = updateDto.wasteQtyKg;
    }
    if (updateDto.startTime !== undefined) {
      updateData.startTime = updateDto.startTime;
    }
    if (updateDto.endTime !== undefined) {
      updateData.endTime = updateDto.endTime;
    }
    if (updateDto.avgTempC !== undefined) {
      updateData.avgTempC = updateDto.avgTempC;
    }
    if (updateDto.retentionTimeSec !== undefined) {
      updateData.retentionTimeSec = updateDto.retentionTimeSec;
    }
    if (updateDto.fuelUsedL !== undefined) {
      updateData.fuelUsedL = updateDto.fuelUsedL;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(incinerationId, updateData);
  }

  async remove(incinerationId: string): Promise<void> {
    await this.findOne(incinerationId); // Validate existence
    await this.repository.softDelete(incinerationId);
  }

  private async generateInciRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    
    // Find the latest incineration register number for this year
    const incinerations = await this.repository.findAll();
    const yearIncinerations = incinerations.filter(
      (inc) => inc.inciRegNum.startsWith(prefix)
    );
    
    if (yearIncinerations.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearIncinerations.map((inc) => {
      const seq = inc.inciRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
