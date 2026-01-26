import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sample } from './sample.entity';

@Injectable()
export class SampleRepository {
  constructor(
    @InjectRepository(Sample, 'master') // Specify 'master' connection
    private readonly repository: Repository<Sample>,
  ) {}

  async findAll(): Promise<Sample[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sample | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  async create(data: Partial<Sample>): Promise<Sample> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Sample>): Promise<Sample> {
    await this.repository.update(id, data);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new Error('Sample not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
