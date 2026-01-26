import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClause } from '../../domain/entities/agreement-clause.domain.entity';
import { CreateAgreementClauseDto } from '../dto/create-agreement-clause.dto';
import { AgreementClausePointNumExistsException } from '../../domain/exceptions/agreement-clause.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateAgreementClauseUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(dto: CreateAgreementClauseDto, createdBy?: string | null): Promise<AgreementClause> {
    // Check if point number already exists for this agreement
    const existing = await this.repository.findAll(dto.agreementId);
    const duplicate = existing.find(c => c.pointNum === dto.pointNum && !c.isDeleted);
    if (duplicate) {
      throw new AgreementClausePointNumExistsException(dto.pointNum, dto.agreementId);
    }

    const clauseId = randomUUID();
    const agreementClauseID = `CLS${String(Date.now()).slice(-6)}`;
    
    const clause = AgreementClause.create({
      clauseId,
      agreementClauseID,
      agreementId: dto.agreementId,
      pointNum: dto.pointNum,
      pointTitle: dto.pointTitle,
      pointText: dto.pointText,
      sequenceNo: dto.sequenceNo,
      status: dto.status || 'Active',
      createdBy: createdBy || null,
    });

    return this.repository.create(clause);
  }
}
