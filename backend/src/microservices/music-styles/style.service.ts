import { injectable } from "tsyringe";
import { StyleRepository } from "./style.repository";
import { CreateStyleDTO, UpdateStyleDTO } from "./style.dto";
import createError from "http-errors";
import { Order } from "@/utils/enums/order.enum";

@injectable()
export class StyleService {
  constructor(private readonly styleRepository: StyleRepository) {}

  async create(data: CreateStyleDTO) {
    await this.findExist(data.name);
    return await this.styleRepository.create(data);
  }

  async findAll(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.styleRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.styleRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async findOne(styleId: number) {
    const style = await this.styleRepository.findOne(styleId);
    if (!style) throw createError(404, "style not found");
    return style;
  }

  async update(styleId: number, data: UpdateStyleDTO) {
    const style = await this.findOne(styleId);
    return await this.styleRepository.update(style.id, data);
  }

  async remove(styleId: number) {
    const style = await this.findOne(styleId);
    return await this.styleRepository.delete(style.id);
  }

  private async findExist(name: string) {
    const style = await this.styleRepository.findByParams({ name });
    if (style) throw createError(409, "style already exist");
  }
}
