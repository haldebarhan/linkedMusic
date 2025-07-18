import { Order } from "../enums/order.enum";

export class BaseRepository<T, TCreateDTO, TUpdateDTO> {
  protected readonly model: {
    create(data: { data: TCreateDTO }): Promise<T>;
    findMany(args?: any): Promise<T[]>;
    findUnique(args: any): Promise<T | null>;
    update(args: any): Promise<T>;
    delete(args: any): Promise<T>;
    count(args?: any): Promise<number>;
    findFirst(args: any): Promise<T | null>;
  };

  constructor(model: any) {
    this.model = model;
  }

  async create(data: TCreateDTO): Promise<T> {
    return this.model.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    order?: Order;
  }): Promise<T[]> {
    const { skip, take, where, order } = params;
    return this.model.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: order ?? Order.DESC,
      },
    });
  }

  async findOne(id: number): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: TUpdateDTO): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async findByParams(where: any): Promise<T | null> {
    return this.model.findUnique({ where });
  }

  async findManyByParams(where: any): Promise<T[]> {
    return this.model.findMany({ where });
  }
}
