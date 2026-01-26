import { Injectable, Inject } from '@nestjs/common';
import { IAgreementRepository, AGREEMENT_REPOSITORY_TOKEN } from '../../domain/interfaces/agreement.repository.interface';
import { AgreementNotFoundException } from '../../domain/exceptions/agreement.exceptions';

@Injectable()
export class DeleteAgreementUseCase {
  constructor(
    @Inject(AGREEMENT_REPOSITORY_TOKEN)
    private readonly repository: IAgreementRepository,
  ) {}

  async execute(id: string, modifiedBy?: string | null): Promise<void> {
    const agreement = await this.repository.findOne(id);
    if (!agreement) {
      throw new AgreementNotFoundException(id);
    }
    await this.repository.delete(id, modifiedBy);
  }
}
