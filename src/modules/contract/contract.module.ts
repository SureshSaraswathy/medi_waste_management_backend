import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from './infrastructure/transaction/contract.entity';
import { ContractController } from './presentation/contract.controller';
import { ContractRepository } from './infrastructure/persistence/contract.repository';
import { CreateContractUseCase } from './application/use-cases/create-contract.use-case';
import { GetContractUseCase } from './application/use-cases/get-contract.use-case';
import { GetAllContractsUseCase } from './application/use-cases/get-all-contracts.use-case';
import { UpdateContractUseCase } from './application/use-cases/update-contract.use-case';
import { DeleteContractUseCase } from './application/use-cases/delete-contract.use-case';
import { CONTRACT_REPOSITORY_TOKEN } from './domain/interfaces/contract.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractEntity], 'transaction'),
  ],
  controllers: [ContractController],
  providers: [
    {
      provide: CONTRACT_REPOSITORY_TOKEN,
      useClass: ContractRepository,
    },
    CreateContractUseCase,
    GetContractUseCase,
    GetAllContractsUseCase,
    UpdateContractUseCase,
    DeleteContractUseCase,
  ],
  exports: [CONTRACT_REPOSITORY_TOKEN],
})
export class ContractModule {}
