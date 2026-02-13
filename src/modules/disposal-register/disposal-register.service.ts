import { Injectable, NotFoundException } from '@nestjs/common';
import { DisposalRegisterRepository } from './infrastructure/persistence/disposal-register.repository';
import { CreateDisposalRegisterDto } from './application/dto/create-disposal-register.dto';
import { UpdateDisposalRegisterDto } from './application/dto/update-disposal-register.dto';
import { DisposalRegisterEntity } from './infrastructure/transaction/disposal-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DisposalRegisterService {
  constructor(private readonly repository: DisposalRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<DisposalRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(disposalId: string): Promise<DisposalRegisterEntity> {
    const disposal = await this.repository.findById(disposalId);
    if (!disposal) {
      throw new NotFoundException(`Disposal register with ID ${disposalId} not found`);
    }
    return disposal;
  }

  async create(createDto: CreateDisposalRegisterDto, userId?: string): Promise<DisposalRegisterEntity> {
    // Generate disposal register number
    const dispoRegNum = await this.generateDispoRegNum();

    const disposalData: Partial<DisposalRegisterEntity> = {
      disposalId: uuidv4(),
      dispoRegNum,
      companyId: createDto.companyId,
      disposalDate: new Date(createDto.disposalDate),
      sourceTreatmentType: createDto.sourceTreatmentType,
      sourceBatchRef: createDto.sourceBatchRef,
      wasteType: createDto.wasteType,
      quantityKg: createDto.quantityKg,
      disposalMethod: createDto.disposalMethod,
      disposalSite: createDto.disposalSite,
      transportMode: createDto.transportMode,
      vehicleNo: createDto.vehicleNo,
      manifestNo: createDto.manifestNo,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(disposalData);
  }

  async update(disposalId: string, updateDto: UpdateDisposalRegisterDto, userId?: string): Promise<DisposalRegisterEntity> {
    await this.findOne(disposalId); // Validate existence

    const updateData: Partial<DisposalRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.disposalDate) {
      updateData.disposalDate = new Date(updateDto.disposalDate);
    }
    if (updateDto.sourceTreatmentType !== undefined) {
      updateData.sourceTreatmentType = updateDto.sourceTreatmentType;
    }
    if (updateDto.sourceBatchRef !== undefined) {
      updateData.sourceBatchRef = updateDto.sourceBatchRef;
    }
    if (updateDto.wasteType !== undefined) {
      updateData.wasteType = updateDto.wasteType;
    }
    if (updateDto.quantityKg !== undefined) {
      updateData.quantityKg = updateDto.quantityKg;
    }
    if (updateDto.disposalMethod !== undefined) {
      updateData.disposalMethod = updateDto.disposalMethod;
    }
    if (updateDto.disposalSite !== undefined) {
      updateData.disposalSite = updateDto.disposalSite;
    }
    if (updateDto.transportMode !== undefined) {
      updateData.transportMode = updateDto.transportMode;
    }
    if (updateDto.vehicleNo !== undefined) {
      updateData.vehicleNo = updateDto.vehicleNo;
    }
    if (updateDto.manifestNo !== undefined) {
      updateData.manifestNo = updateDto.manifestNo;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(disposalId, updateData);
  }

  async remove(disposalId: string): Promise<void> {
    await this.findOne(disposalId); // Validate existence
    await this.repository.softDelete(disposalId);
  }

  private async generateDispoRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DIS-${year}-`;
    
    // Find the latest disposal register number for this year
    const disposals = await this.repository.findAll();
    const yearDisposals = disposals.filter(
      (dis) => dis.dispoRegNum.startsWith(prefix)
    );
    
    if (yearDisposals.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearDisposals.map((dis) => {
      const seq = dis.dispoRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
