import { Injectable, Inject } from '@nestjs/common';
import { IAgreementRepository, AGREEMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement.repository.interface';
import { Agreement } from '../../domain/entities/agreement.domain.entity';
import { UpdateAgreementDto } from '../dto/update-agreement.dto';
import { AgreementNotFoundException } from '../../domain/exceptions/agreement.exceptions';

@Injectable()
export class UpdateAgreementUseCase {
  constructor(
    @Inject(AGREEMENT_REPOSITORY_TOKEN)
    private readonly repository: IAgreementRepository,
  ) {}

  async execute(id: string, dto: UpdateAgreementDto, modifiedBy?: string | null): Promise<Agreement> {
    const agreement = await this.repository.findOne(id);
    if (!agreement) {
      throw new AgreementNotFoundException(id);
    }

    agreement.update({
      agreementNum: dto.agreementNum,
      agreementDate: dto.agreementDate ? new Date(dto.agreementDate) : undefined,
      status: dto.status,
      modifiedBy: modifiedBy || null,
    });

    return this.repository.update(agreement);
  }
}
