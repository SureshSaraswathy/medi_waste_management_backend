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
    // Check if agreement number already exists for this contract
    if (dto.agreementNum) {
      const existing = await this.repository.findAll(dto.contractId);
      const duplicate = existing.find(a => a.agreementNum === dto.agreementNum && !a.isDeleted);
      if (duplicate) {
        throw new AgreementAlreadyExistsException(dto.agreementNum, dto.contractId);
      }
    }

    const agreementId = randomUUID();
    const agreementID = `AGR${String(Date.now()).slice(-6)}`;
    const agreementNum = dto.agreementNum || `AGR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
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
}
