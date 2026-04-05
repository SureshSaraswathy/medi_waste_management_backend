import { Injectable, NotFoundException } from '@nestjs/common';
import { ShredderRegisterRepository } from './infrastructure/persistence/shredder-register.repository';
import { CreateShredderRegisterDto } from './application/dto/create-shredder-register.dto';
import { UpdateShredderRegisterDto } from './application/dto/update-shredder-register.dto';
import { ShredderRegisterEntity } from './infrastructure/transaction/shredder-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShredderRegisterService {
  constructor(private readonly repository: ShredderRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<ShredderRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(shredderId: string): Promise<ShredderRegisterEntity> {
    const shredder = await this.repository.findById(shredderId);
    if (!shredder) {
      throw new NotFoundException(`Shredder register with ID ${shredderId} not found`);
    }
    return shredder;
  }

  async create(createDto: CreateShredderRegisterDto, userId?: string): Promise<ShredderRegisterEntity> {
    // Generate shredder register number
    const shredRegNum = await this.generateShredRegNum();

    const shredderData: Partial<ShredderRegisterEntity> = {
      shredderId: uuidv4(),
      shredRegNum,
      companyId: createDto.companyId,
      shredderDate: new Date(createDto.shredderDate),
      equipmentId: createDto.equipmentId,
      batchNo: createDto.batchNo,
      wasteCategory: createDto.wasteCategory,
      wasteQtyKg: createDto.wasteQtyKg ?? null,
      startTime: createDto.startTime,
      endTime: createDto.endTime,
      temperatureC: createDto.temperatureC ?? null,
      pressureBar: createDto.pressureBar ?? null,
      cycleTimeMin: createDto.cycleTimeMin,
      indicatorResult: createDto.indicatorResult,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      inputSourceType: createDto.inputSourceType,
      inputSourceRef: createDto.inputSourceRef,
      inputQtyKg: createDto.inputQtyKg,
      outputQtyKg: createDto.outputQtyKg,
      bladeCondition: createDto.bladeCondition,
      outputDispatchedTo: createDto.outputDispatchedTo,
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(shredderData);
  }

  async update(shredderId: string, updateDto: UpdateShredderRegisterDto, userId?: string): Promise<ShredderRegisterEntity> {
    await this.findOne(shredderId); // Validate existence

    const updateData: Partial<ShredderRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.shredderDate) {
      updateData.shredderDate = new Date(updateDto.shredderDate);
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
    if (updateDto.inputSourceType !== undefined) {
      updateData.inputSourceType = updateDto.inputSourceType;
    }
    if (updateDto.inputSourceRef !== undefined) {
      updateData.inputSourceRef = updateDto.inputSourceRef;
    }
    if (updateDto.inputQtyKg !== undefined) {
      updateData.inputQtyKg = updateDto.inputQtyKg;
    }
    if (updateDto.outputQtyKg !== undefined) {
      updateData.outputQtyKg = updateDto.outputQtyKg;
    }
    if (updateDto.bladeCondition !== undefined) {
      updateData.bladeCondition = updateDto.bladeCondition;
    }
    if (updateDto.outputDispatchedTo !== undefined) {
      updateData.outputDispatchedTo = updateDto.outputDispatchedTo;
    }

    return this.repository.update(shredderId, updateData);
  }

  async remove(shredderId: string): Promise<void> {
    await this.findOne(shredderId); // Validate existence
    await this.repository.softDelete(shredderId);
  }

  private async generateShredRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SHR-${year}-`;
    
    // Find the latest shredder register number for this year
    const shredders = await this.repository.findAll();
    const yearShredders = shredders.filter(
      (shr) => shr.shredRegNum.startsWith(prefix)
    );
    
    if (yearShredders.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearShredders.map((shr) => {
      const seq = shr.shredRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
