import { Injectable, NotFoundException } from '@nestjs/common';
import { SampleRepository } from './sample.repository';
import { Sample } from './sample.entity';
import { CreateSampleDto } from './dto/create-sample.dto';
import { UpdateSampleDto } from './dto/update-sample.dto';

@Injectable()
export class SampleService {
  constructor(private readonly repository: SampleRepository) {}

  async findAll(): Promise<Sample[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<Sample> {
    const sample = await this.repository.findOne(id);
    if (!sample) {
      throw new NotFoundException(`Sample with ID ${id} not found`);
    }
    return sample;
  }

  async create(createSampleDto: CreateSampleDto): Promise<Sample> {
    return this.repository.create(createSampleDto);
  }

  async update(id: string, updateSampleDto: UpdateSampleDto): Promise<Sample> {
    await this.findOne(id); // Validate existence
    return this.repository.update(id, updateSampleDto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Validate existence
    await this.repository.delete(id);
  }
}
