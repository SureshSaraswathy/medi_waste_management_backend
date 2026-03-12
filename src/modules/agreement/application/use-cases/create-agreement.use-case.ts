import { Injectable, Inject } from '@nestjs/common';
import { IAgreementRepository, AGREEMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement.repository.interface';
import { Agreement } from '../../domain/entities/agreement.domain.entity';
import { CreateAgreementDto } from '../dto/create-agreement.dto';
import { AgreementAlreadyExistsException } from '../../domain/exceptions/agreement.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateAgreementUseCase {
  constructor(
    @Inject(AGREEMENT_REPOSITORY_TOKEN)
    private readonly repository: IAgreementRepository,
  ) {}

  async execute(dto: CreateAgreementDto, createdBy?: string | null): Promise<Agreement> {
    // Auto-generate agreement number if not provided
    let agreementNum = dto.agreementNum;
    
    if (!agreementNum) {
      agreementNum = await this.generateAgreementNumber();
    } else {
      // Check if agreement number already exists for this contract
      const existing = await this.repository.findAll(dto.contractId);
      const duplicate = existing.find(a => a.agreementNum === agreementNum && !a.isDeleted);
      if (duplicate) {
        throw new AgreementAlreadyExistsException(agreementNum, dto.contractId);
      }
    }

    const agreementId = randomUUID();
    const agreementID = `AGR${String(Date.now()).slice(-6)}`;
    
    const agreement = Agreement.create({
      agreementId,
      agreementID,
      agreementNum,
      contractId: dto.contractId,
      agreementDate: new Date(dto.agreementDate),
      status: dto.status || 'Draft',
      createdBy: createdBy || null,
    });

    return this.repository.create(agreement);
  }

  private async generateAgreementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AGR-${year}-`;
    
    // Find all agreements for this year
    const allAgreements = await this.repository.findAll();
    const yearAgreements = allAgreements.filter(
      (a) => a.agreementNum.startsWith(prefix) && !a.isDeleted
    );
    
    if (yearAgreements.length === 0) {
      return `${prefix}0001`;
    }
    
    // Extract the highest sequence number
    const sequences = yearAgreements.map((a) => {
      const seq = a.agreementNum.replace(prefix, '');
      return parseInt(seq, 10);
    });
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = maxSeq + 1;
    const nextSeqStr = nextSeq.toString().padStart(4, '0');
    
    return `${prefix}${nextSeqStr}`;
  }
}
