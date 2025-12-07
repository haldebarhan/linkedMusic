import { injectable } from "tsyringe";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { Instrument, PrismaClient } from "@prisma/client";
import DatabaseService from "../../utils/services/database.service";
import { Order } from "../../utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class InstrumentRepository extends ReferenceBaseRepository<Instrument> {
  constructor() {
    super(prisma, "instrument");
  }

  /**
   * Trouve par slug
   */
  async findBySlug(slug: string): Promise<Instrument | null> {
    return this.findOne({ slug });
  }

  /**
   * Trouve par catégorie
   */
  async findByCategory(
    category: string,
    activeOnly: boolean = true
  ): Promise<Instrument[]> {
    const where: any = { category };
    if (activeOnly) {
      where.active = true;
    }

    return this.findAll({
      where,
      orderBy: { order: "asc" },
    });
  }

  /**
   * Trouve tous les instruments actifs
   */
  async findAllActive(): Promise<Instrument[]> {
    return this.findAll({
      where: { active: true },
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Recherche par nom
   */
  async search(query: string): Promise<Instrument[]> {
    return this.findAll({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
        active: true,
      },
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Récupère les catégories uniques
   */
  async getCategories(): Promise<string[]> {
    const instruments = await prisma.instrument.findMany({
      where: { active: true },
      distinct: ["category"],
      select: { category: true },
    });

    return instruments
      .map((i) => i.category)
      .filter((c): c is string => c !== null)
      .sort();
  }
}
