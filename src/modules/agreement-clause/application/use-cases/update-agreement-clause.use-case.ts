import { Injectable, Inject } from '@nestjs/common';
import { IAgreementClauseRepository, AGREEMENT_CLAUSE_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement-clause.repository.interface';
import { AgreementClause } from '../../domain/entities/agreement-clause.domain.entity';
import { UpdateAgreementClauseDto } from '../dto/update-agreement-clause.dto';
import { AgreementClauseNotFoundException, AgreementClausePointNumExistsException } from '../../domain/exceptions/agreement-clause.exceptions';

@Injectable()
export class UpdateAgreementClauseUseCase {
  constructor(
    @Inject(AGREEMENT_CLAUSE_REPOSITORY_TOKEN)
    private readonly repository: IAgreementClauseRepository,
  ) {}

  async execute(id: string, dto: UpdateAgreementClauseDto, modifiedBy?: string | null): Promise<AgreementClause> {
    const clause = await this.repository.findOne(id);
    if (!clause) {
      throw new AgreementClauseNotFoundException(id);
    }

    // Check if point number already exists for this agreement (if changing pointNum)
    if (dto.pointNum && dto.pointNum !== clause.pointNum) {
      const existing = await this.repository.findAll(clause.agreementId);
      const duplicate = existing.find(c => c.pointNum === dto.pointNum && c.clauseId !== id && !c.isDeleted);
      if (duplicate) {
        throw new AgreementClausePointNumExistsException(dto.pointNum, clause.agreementId);
      }
    }

    clause.update({
      pointNum: dto.pointNum,
      pointTitle: dto.pointTitle,
      pointText: dto.pointText,
      sequenceNo: dto.sequenceNo,
      status: dto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.repository.update(clause);
  }
}
