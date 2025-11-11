import { injectable } from "tsyringe";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { PrismaClient, Software } from "@prisma/client";
import { Order } from "@/utils/enums/order.enum";
import DatabaseService from "@/utils/services/database.service";
const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class SoftwareRepository extends ReferenceBaseRepository<Software> {
  constructor(prisma: PrismaClient) {
    super(prisma, "software");
  }

  /**
   * Trouve par slug
   */
  async findBySlug(slug: string): Promise<Software | null> {
    return this.findOne({ slug });
  }

  /**
   * Trouve par type
   */
  async findByType(
    type: string,
    activeOnly: boolean = true
  ): Promise<Software[]> {
    const where: any = { type };
    if (activeOnly) {
      where.active = true;
    }

    return this.findAll({
      where,
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Trouve tous les logiciels actifs
   */
  async findAllActive(): Promise<Software[]> {
    return this.findAll({
      where: { active: true },
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Recherche par nom
   */
  async search(query: string): Promise<Software[]> {
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
   * Récupère les types uniques
   */
  async getTypes(): Promise<string[]> {
    const software = await prisma.software.findMany({
      where: { active: true },
      distinct: ["type"],
      select: { type: true },
    });

    return software.map((s) => s.type).sort();
  }
}
