import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { IHcfRepository, HCF_REPOSITORY_TOKEN } from '../../../hcf/domain/interfaces/hcf.repository.interface';
import { ICompanyRepository, COMPANY_REPOSITORY_TOKEN } from '../../../company/domain/interfaces/company.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { CreateWasteTransactionDto } from '../dto/create-waste-transaction.dto';
import { InvalidCompanyException, InvalidHcfException } from '../../domain/exceptions/waste-transaction.exceptions';
import { randomUUID } from 'crypto';

@Injectable()
export class CreateWasteTransactionUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
    @Inject(HCF_REPOSITORY_TOKEN)
    private readonly hcfRepository: IHcfRepository,
    @Inject(COMPANY_REPOSITORY_TOKEN)
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(createWasteTransactionDto: CreateWasteTransactionDto, createdBy?: string): Promise<WasteTransaction> {
    // Validate HCF exists
    const hcf = await this.hcfRepository.findById(createWasteTransactionDto.hcfId);
    if (!hcf) {
      throw new InvalidHcfException(createWasteTransactionDto.hcfId);
    }

    // Validate Company exists
    const company = await this.companyRepository.findById(createWasteTransactionDto.companyId);
    if (!company) {
      throw new InvalidCompanyException(createWasteTransactionDto.companyId);
    }

    const wasteTransaction = WasteTransaction.create({
      wasteTransactionId: randomUUID(),
      companyId: createWasteTransactionDto.companyId,
      hcfId: createWasteTransactionDto.hcfId,
      pickupDate: new Date(createWasteTransactionDto.pickupDate),
      isNilPickup: createWasteTransactionDto.isNilPickup ?? false,
      yellowBagCount: createWasteTransactionDto.yellowBagCount ?? 0,
      redBagCount: createWasteTransactionDto.redBagCount ?? 0,
      whiteBagCount: createWasteTransactionDto.whiteBagCount ?? 0,
      blueBagCount: createWasteTransactionDto.blueBagCount ?? 0,
      yellowWeightKg: createWasteTransactionDto.yellowWeightKg,
      redWeightKg: createWasteTransactionDto.redWeightKg,
      whiteWeightKg: createWasteTransactionDto.whiteWeightKg,
      blueWeightKg: createWasteTransactionDto.blueWeightKg,
      latitude: createWasteTransactionDto.latitude,
      longitude: createWasteTransactionDto.longitude,
      segregationQuality: createWasteTransactionDto.segregationQuality,
      notes: createWasteTransactionDto.notes,
      createdBy: createdBy || null,
    });

    return this.wasteTransactionRepository.create(wasteTransaction);
  }
}
