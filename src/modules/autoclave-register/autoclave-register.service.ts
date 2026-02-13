import { Injectable, NotFoundException } from '@nestjs/common';
import { AutoclaveRegisterRepository } from './infrastructure/persistence/autoclave-register.repository';
import { CreateAutoclaveRegisterDto } from './application/dto/create-autoclave-register.dto';
import { UpdateAutoclaveRegisterDto } from './application/dto/update-autoclave-register.dto';
import { AutoclaveRegisterEntity } from './infrastructure/transaction/autoclave-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AutoclaveRegisterService {
  constructor(private readonly repository: AutoclaveRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<AutoclaveRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(autoclaveId: string): Promise<AutoclaveRegisterEntity> {
    const autoclave = await this.repository.findById(autoclaveId);
    if (!autoclave) {
      throw new NotFoundException(`Autoclave register with ID ${autoclaveId} not found`);
    }
    return autoclave;
  }

  async create(createDto: CreateAutoclaveRegisterDto, userId?: string): Promise<AutoclaveRegisterEntity> {
    // Generate autoclave register number
    const autoclRegNum = await this.generateAutoclRegNum();

    const autoclaveData: Partial<AutoclaveRegisterEntity> = {
      autoclaveId: uuidv4(),
      autoclRegNum,
      companyId: createDto.companyId,
      autoclaveDate: new Date(createDto.autoclaveDate),
      equipmentId: createDto.equipmentId,
      batchNo: createDto.batchNo,
      wasteCategory: createDto.wasteCategory,
      wasteQtyKg: createDto.wasteQtyKg,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      temperatureC: createDto.temperatureC,
      pressureBar: createDto.pressureBar,
      cycleTimeMin: createDto.cycleTimeMin,
      indicatorResult: createDto.indicatorResult,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(autoclaveData);
  }

  async update(autoclaveId: string, updateDto: UpdateAutoclaveRegisterDto, userId?: string): Promise<AutoclaveRegisterEntity> {
    await this.findOne(autoclaveId); // Validate existence

    const updateData: Partial<AutoclaveRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.autoclaveDate) {
      updateData.autoclaveDate = new Date(updateDto.autoclaveDate);
    }
    if (updateDto.equipmentId !== undefined) {
      updateData.equipmentId = updateDto.equipmentId;
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
    if (updateDto.temperatureC !== undefined) {
      updateData.temperatureC = updateDto.temperatureC;
    }
    if (updateDto.pressureBar !== undefined) {
      updateData.pressureBar = updateDto.pressureBar;
    }
    if (updateDto.cycleTimeMin !== undefined) {
      updateData.cycleTimeMin = updateDto.cycleTimeMin;
    }
    if (updateDto.indicatorResult !== undefined) {
      updateData.indicatorResult = updateDto.indicatorResult;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(autoclaveId, updateData);
  }

  async remove(autoclaveId: string): Promise<void> {
    await this.findOne(autoclaveId); // Validate existence
    await this.repository.softDelete(autoclaveId);
  }

  private async generateAutoclRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AUT-${year}-`;
    
    // Find the latest autoclave register number for this year
    const autoclaves = await this.repository.findAll();
    const yearAutoclaves = autoclaves.filter(
      (aut) => aut.autoclRegNum.startsWith(prefix)
    );
    
    if (yearAutoclaves.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearAutoclaves.map((aut) => {
      const seq = aut.autoclRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
