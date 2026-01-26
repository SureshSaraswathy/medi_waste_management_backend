import { Injectable, Inject } from '@nestjs/common';
import { IWasteCollectionRepository, WASTE_COLLECTION_REPOSITORY_TOKEN } from '../../domain/interfaces/waste-collection.repository.interface';
import { WasteCollection } from '../../domain/entities/waste-collection.domain.entity';

@Injectable()
export class GetAllWasteCollectionsUseCase {
  constructor(
    @Inject(WASTE_COLLECTION_REPOSITORY_TOKEN)
    private readonly wasteCollectionRepository: IWasteCollectionRepository,
  ) {}

  async execute(
    companyId?: string,
    hcfId?: string,
    date?: string,
    endDate?: string,
    status?: string,
    routeAssignmentId?: string,
  ): Promise<WasteCollection[]> {
    if (routeAssignmentId) {
      return this.wasteCollectionRepository.findByRouteAssignment(routeAssignmentId);
    }

    if (date) {
      const collectionDate = new Date(date);
      if (endDate) {
        const endCollectionDate = new Date(endDate);
        if (hcfId) {
          const allByDateRange = await this.wasteCollectionRepository.findByHcf(hcfId, collectionDate, endCollectionDate);
          return status ? allByDateRange.filter((wc) => wc.status === status) : allByDateRange;
        }
        if (companyId) {
          const allByDateRange = await this.wasteCollectionRepository.findByCompany(companyId, collectionDate, endCollectionDate);
          return status ? allByDateRange.filter((wc) => wc.status === status) : allByDateRange;
        }
        const allByDateRange = await this.wasteCollectionRepository.findByDateRange(collectionDate, endCollectionDate);
        return status ? allByDateRange.filter((wc) => wc.status === status) : allByDateRange;
      }
      
      if (hcfId) {
        const allByDate = await this.wasteCollectionRepository.findByHcf(hcfId, collectionDate);
        return status ? allByDate.filter((wc) => wc.status === status) : allByDate;
      }
      if (companyId) {
        const allByDate = await this.wasteCollectionRepository.findByCompany(companyId, collectionDate);
        return status ? allByDate.filter((wc) => wc.status === status) : allByDate;
      }
      const allByDate = await this.wasteCollectionRepository.findByDate(collectionDate);
      return status ? allByDate.filter((wc) => wc.status === status) : allByDate;
    }

    if (hcfId) {
      if (status) {
        const allByHcf = await this.wasteCollectionRepository.findByHcf(hcfId);
        return allByHcf.filter((wc) => wc.status === status);
      }
      return this.wasteCollectionRepository.findByHcf(hcfId);
    }

    if (companyId) {
      if (status) {
        const allByCompany = await this.wasteCollectionRepository.findByCompany(companyId);
        return allByCompany.filter((wc) => wc.status === status);
      }
      return this.wasteCollectionRepository.findByCompany(companyId);
    }

    if (status) {
      return this.wasteCollectionRepository.findByStatus(status);
    }

    return this.wasteCollectionRepository.findAll();
  }
}
