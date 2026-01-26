import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorController } from './presentation/color.controller';
import { ColorRepository } from './infrastructure/persistence/color.repository';
import { ColorEntity } from './infrastructure/persistence/color.entity';
import { CreateColorUseCase } from './application/use-cases/create-color.use-case';
import { GetColorUseCase } from './application/use-cases/get-color.use-case';
import { GetAllColorsUseCase } from './application/use-cases/get-all-colors.use-case';
import { UpdateColorUseCase } from './application/use-cases/update-color.use-case';
import { DeleteColorUseCase } from './application/use-cases/delete-color.use-case';
import { COLOR_REPOSITORY_TOKEN } from './domain/interfaces/color.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ColorEntity], 'master')],
  controllers: [ColorController],
  providers: [
    {
      provide: COLOR_REPOSITORY_TOKEN,
      useClass: ColorRepository,
    },
    CreateColorUseCase,
    GetColorUseCase,
    GetAllColorsUseCase,
    UpdateColorUseCase,
    DeleteColorUseCase,
  ],
  exports: [COLOR_REPOSITORY_TOKEN],
})
export class ColorModule {}
