import { Injectable, NotFoundException } from '@nestjs/common';
import { EmissionRegisterRepository } from './infrastructure/persistence/emission-register.repository';
import { CreateEmissionRegisterDto } from './application/dto/create-emission-register.dto';
import { UpdateEmissionRegisterDto } from './application/dto/update-emission-register.dto';
import { EmissionRegisterEntity } from './infrastructure/transaction/emission-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmissionRegisterService {
  constructor(private readonly repository: EmissionRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<EmissionRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(emissionId: string): Promise<EmissionRegisterEntity> {
    const emission = await this.repository.findById(emissionId);
    if (!emission) {
      throw new NotFoundException(`Emission register with ID ${emissionId} not found`);
    }
    return emission;
  }

  async create(createDto: CreateEmissionRegisterDto, userId?: string): Promise<EmissionRegisterEntity> {
    // Generate emission register number
    const emisRegNum = await this.generateEmisRegNum();

    const emissionData: Partial<EmissionRegisterEntity> = {
      emissionId: uuidv4(),
      emisRegNum,
      companyId: createDto.companyId,
      emissionDate: new Date(createDto.emissionDate),
      equipmentId: createDto.equipmentId,
      stackId: createDto.stackId,
      pm: createDto.pm,
      co: createDto.co,
      hci: createDto.hci,
      temp: createDto.temp,
      oxygen: createDto.oxygen,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(emissionData);
  }

  async update(emissionId: string, updateDto: UpdateEmissionRegisterDto, userId?: string): Promise<EmissionRegisterEntity> {
    await this.findOne(emissionId); // Validate existence

    const updateData: Partial<EmissionRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.emissionDate) {
      updateData.emissionDate = new Date(updateDto.emissionDate);
    }
    if (updateDto.equipmentId !== undefined) {
      updateData.equipmentId = updateDto.equipmentId;
    }
    if (updateDto.stackId !== undefined) {
      updateData.stackId = updateDto.stackId;
    }
    if (updateDto.pm !== undefined) {
      updateData.pm = updateDto.pm;
    }
    if (updateDto.co !== undefined) {
      updateData.co = updateDto.co;
    }
    if (updateDto.hci !== undefined) {
      updateData.hci = updateDto.hci;
    }
    if (updateDto.temp !== undefined) {
      updateData.temp = updateDto.temp;
    }
    if (updateDto.oxygen !== undefined) {
      updateData.oxygen = updateDto.oxygen;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(emissionId, updateData);
  }

  async remove(emissionId: string): Promise<void> {
    await this.findOne(emissionId); // Validate existence
    await this.repository.softDelete(emissionId);
  }

  private async generateEmisRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EMI-${year}-`;
    
    // Find the latest emission register number for this year
    const emissions = await this.repository.findAll();
    const yearEmissions = emissions.filter(
      (emi) => emi.emisRegNum.startsWith(prefix)
    );
    
    if (yearEmissions.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearEmissions.map((emi) => {
      const seq = emi.emisRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
