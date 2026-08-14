import { Language, PrismaClient } from "@prisma/client";
import { BaseRepository } from "../../utils/classes/base.repository";
import { Order } from "../../utils/enums/order.enum";
import DatabaseService from "../../utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

export class LanguageRepository extends BaseRepository<Language> {
  constructor() {
    super(prisma, "language");
  }
  /**
   * Trouve par code
   */
  async findByCode(code: string): Promise<Language | null> {
    return this.findOne({ code });
  }

  /**
   * Trouve toutes les langues actives
   */
  async findAllActive(): Promise<Language[]> {
    return this.findAll({
      where: { active: true },
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Recherche par nom
   */
  async search(query: string): Promise<Language[]> {
    return this.findAll({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        active: true,
      },
      orderBy: { order: Order.ASC },
    });
  }
}
