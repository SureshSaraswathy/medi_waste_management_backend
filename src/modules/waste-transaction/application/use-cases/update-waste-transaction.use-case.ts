import { Injectable, Inject } from '@nestjs/common';
import { IWasteTransactionRepository, WASTE_TRANSACTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-transaction.repository.interface';
import { WasteTransaction } from '../../domain/entities/waste-transaction.domain.entity';
import { UpdateWasteTransactionDto } from '../dto/update-waste-transaction.dto';
import { WasteTransactionNotFoundException } from '../../domain/exceptions/waste-transaction.exceptions';

@Injectable()
export class UpdateWasteTransactionUseCase {
  constructor(
    @Inject(WASTE_TRANSACTION_REPOSITORY_TOKEN)
    private readonly wasteTransactionRepository: IWasteTransactionRepository,
  ) {}

  async execute(
    wasteTransactionId: string,
    updateWasteTransactionDto: UpdateWasteTransactionDto,
    modifiedBy?: string,
  ): Promise<WasteTransaction> {
    const transaction = await this.wasteTransactionRepository.findById(wasteTransactionId);
    if (!transaction) {
      throw new WasteTransactionNotFoundException(wasteTransactionId);
    }

    const updated = transaction.update({
      pickupDate: updateWasteTransactionDto.pickupDate
        ? new Date(updateWasteTransactionDto.pickupDate)
        : undefined,
      isNilPickup: updateWasteTransactionDto.isNilPickup,
      yellowBagCount: updateWasteTransactionDto.yellowBagCount,
      redBagCount: updateWasteTransactionDto.redBagCount,
      whiteBagCount: updateWasteTransactionDto.whiteBagCount,
      blueBagCount: updateWasteTransactionDto.blueBagCount,
      yellowWeightKg: updateWasteTransactionDto.yellowWeightKg,
      redWeightKg: updateWasteTransactionDto.redWeightKg,
      whiteWeightKg: updateWasteTransactionDto.whiteWeightKg,
      blueWeightKg: updateWasteTransactionDto.blueWeightKg,
      latitude: updateWasteTransactionDto.latitude,
      longitude: updateWasteTransactionDto.longitude,
      segregationQuality: updateWasteTransactionDto.segregationQuality,
      notes: updateWasteTransactionDto.notes,
      modifiedBy: modifiedBy || null,
    });

    return this.wasteTransactionRepository.update(updated);
  }
}
