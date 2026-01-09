import { FindManyOptions, FindOneOptions, Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { BaseEntity } from '../models/BaseEntity';

export class BaseService<T extends BaseEntity> {
  constructor(private repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<{ data: T[]; count: number }> {
    const [data, count] = await this.repository.findAndCount(options);
    return { data, count };
  }

  async findOne(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
      ...options,
    });
  }

  async create(createDto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity as any);
  }

  async update(id: string, updateDto: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOne(id);
    if (!entity) return null;
    
    Object.assign(entity, updateDto);
    return this.repository.save(entity as any);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async softRemove(id: string): Promise<boolean> {
    const entity = await this.findOne(id);
    if (!entity) return false;
    
    const result = await this.repository.softRemove(entity as any);
    return !!result;
  }

  // Add more common service methods as needed
}
