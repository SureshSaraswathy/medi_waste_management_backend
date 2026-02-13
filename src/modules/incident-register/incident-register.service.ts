import { Injectable, NotFoundException } from '@nestjs/common';
import { IncidentRegisterRepository } from './infrastructure/persistence/incident-register.repository';
import { CreateIncidentRegisterDto } from './application/dto/create-incident-register.dto';
import { UpdateIncidentRegisterDto } from './application/dto/update-incident-register.dto';
import { IncidentRegisterEntity } from './infrastructure/transaction/incident-register.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IncidentRegisterService {
  constructor(private readonly repository: IncidentRegisterRepository) {}

  async findAll(companyId?: string, status?: string): Promise<IncidentRegisterEntity[]> {
    if (companyId) {
      return this.repository.findByCompany(companyId);
    }
    if (status) {
      return this.repository.findByStatus(status);
    }
    return this.repository.findAll();
  }

  async findOne(incidentId: string): Promise<IncidentRegisterEntity> {
    const incident = await this.repository.findById(incidentId);
    if (!incident) {
      throw new NotFoundException(`Incident register with ID ${incidentId} not found`);
    }
    return incident;
  }

  async create(createDto: CreateIncidentRegisterDto, userId?: string): Promise<IncidentRegisterEntity> {
    // Generate incident number
    const incidentNum = await this.generateIncidentNum();

    const incidentData: Partial<IncidentRegisterEntity> = {
      incidentId: uuidv4(),
      incidentNum,
      companyId: createDto.companyId,
      incidentDate: new Date(createDto.incidentDate),
      incidentTime: createDto.incidentTime,
      incidentType: createDto.incidentType,
      location: createDto.location,
      wasteCategory: createDto.wasteCategory,
      quantityValue: createDto.quantityValue,
      quantityUnit: createDto.quantityUnit,
      severity: createDto.severity,
      personAffected: createDto.personAffected || null,
      immediateAction: createDto.immediateAction || null,
      medicalAction: createDto.medicalAction || null,
      reportedTo: createDto.reportedTo || null,
      incidentStatus: createDto.incidentStatus || 'Reported',
      status: createDto.status || 'Active',
      createdBy: userId || null,
      modifiedBy: userId || null,
    };

    return this.repository.create(incidentData);
  }

  async update(incidentId: string, updateDto: UpdateIncidentRegisterDto, userId?: string): Promise<IncidentRegisterEntity> {
    await this.findOne(incidentId); // Validate existence

    const updateData: Partial<IncidentRegisterEntity> = {
      modifiedBy: userId || null,
    };

    if (updateDto.incidentDate) {
      updateData.incidentDate = new Date(updateDto.incidentDate);
    }
    if (updateDto.incidentTime !== undefined) {
      updateData.incidentTime = updateDto.incidentTime;
    }
    if (updateDto.incidentType !== undefined) {
      updateData.incidentType = updateDto.incidentType;
    }
    if (updateDto.location !== undefined) {
      updateData.location = updateDto.location;
    }
    if (updateDto.wasteCategory !== undefined) {
      updateData.wasteCategory = updateDto.wasteCategory;
    }
    if (updateDto.quantityValue !== undefined) {
      updateData.quantityValue = updateDto.quantityValue;
    }
    if (updateDto.quantityUnit !== undefined) {
      updateData.quantityUnit = updateDto.quantityUnit;
    }
    if (updateDto.severity !== undefined) {
      updateData.severity = updateDto.severity;
    }
    if (updateDto.personAffected !== undefined) {
      updateData.personAffected = updateDto.personAffected;
    }
    if (updateDto.immediateAction !== undefined) {
      updateData.immediateAction = updateDto.immediateAction;
    }
    if (updateDto.medicalAction !== undefined) {
      updateData.medicalAction = updateDto.medicalAction;
    }
    if (updateDto.reportedTo !== undefined) {
      updateData.reportedTo = updateDto.reportedTo;
    }
    if (updateDto.incidentStatus !== undefined) {
      updateData.incidentStatus = updateDto.incidentStatus;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    return this.repository.update(incidentId, updateData);
  }

  async remove(incidentId: string): Promise<void> {
    await this.findOne(incidentId); // Validate existence
    await this.repository.softDelete(incidentId);
  }

  private async generateIncidentNum(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    
    // Find the latest incident number for this year
    const incidents = await this.repository.findAll();
    const yearIncidents = incidents.filter(
      (inc) => inc.incidentNum.startsWith(prefix)
    );
    
    if (yearIncidents.length === 0) {
      return `${prefix}001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearIncidents.map((inc) => {
      const seq = inc.incidentNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextSeq}`;
  }
}
