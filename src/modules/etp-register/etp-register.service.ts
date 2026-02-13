import { Injectable, NotFoundException } from '@nestjs/common';
import { ETPRegisterRepository } from './infrastructure/persistence/etp-register.repository';
import { CreateETPRegisterDto } from './application/dto/create-etp-register.dto';
import { UpdateETPRegisterDto } from './application/dto/update-etp-register.dto';
import { ETPRegisterEntity } from './infrastructure/transaction/etp-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ETPRegisterService {
  constructor(private readonly repository: ETPRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<ETPRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(etpId: string): Promise<ETPRegisterEntity> {
    const etp = await this.repository.findById(etpId);
    if (!etp) {
      throw new NotFoundException(`ETP register with ID ${etpId} not found`);
    }
    return etp;
  }

  async create(createDto: CreateETPRegisterDto, userId?: string): Promise<ETPRegisterEntity> {
    // Generate ETP register number
    const etpRegNum = await this.generateEtpRegNum();

    const etpData: Partial<ETPRegisterEntity> = {
      etpId: uuidv4(),
      etpRegNum,
      companyId: createDto.companyId,
      date: new Date(createDto.date),
      inflow: createDto.inflow,
      treated: createDto.treated,
      ph: createDto.ph,
      bod: createDto.bod,
      cod: createDto.cod,
      tss: createDto.tss,
      oilGrease: createDto.oilGrease,
      dischargeMode: createDto.dischargeMode,
      complianceStatus: createDto.complianceStatus || 'Compliant',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(etpData);
  }

  async update(etpId: string, updateDto: UpdateETPRegisterDto, userId?: string): Promise<ETPRegisterEntity> {
    await this.findOne(etpId); // Validate existence

    const updateData: Partial<ETPRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }
    if (updateDto.inflow !== undefined) {
      updateData.inflow = updateDto.inflow;
    }
    if (updateDto.treated !== undefined) {
      updateData.treated = updateDto.treated;
    }
    if (updateDto.ph !== undefined) {
      updateData.ph = updateDto.ph;
    }
    if (updateDto.bod !== undefined) {
      updateData.bod = updateDto.bod;
    }
    if (updateDto.cod !== undefined) {
      updateData.cod = updateDto.cod;
    }
    if (updateDto.tss !== undefined) {
      updateData.tss = updateDto.tss;
    }
    if (updateDto.oilGrease !== undefined) {
      updateData.oilGrease = updateDto.oilGrease;
    }
    if (updateDto.dischargeMode !== undefined) {
      updateData.dischargeMode = updateDto.dischargeMode;
    }
    if (updateDto.complianceStatus !== undefined) {
      updateData.complianceStatus = updateDto.complianceStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(etpId, updateData);
  }

  async remove(etpId: string): Promise<void> {
    await this.findOne(etpId); // Validate existence
    await this.repository.softDelete(etpId);
  }

  private async generateEtpRegNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ETP-${year}-`;
    
    // Find the latest ETP register number for this year
    const etps = await this.repository.findAll();
    const yearEtps = etps.filter(
      (etp) => etp.etpRegNum.startsWith(prefix)
    );
    
    if (yearEtps.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearEtps.map((etp) => {
      const seq = etp.etpRegNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
