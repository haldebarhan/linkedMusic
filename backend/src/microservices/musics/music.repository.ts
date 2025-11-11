import { injectable } from "tsyringe";
import { ReferenceBaseRepository } from "../references/reference-base.repository";
import { MusicStyle, PrismaClient } from "@prisma/client";
import { Order } from "@/utils/enums/order.enum";
import DatabaseService from "@/utils/services/database.service";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class MusicStyleRepository extends ReferenceBaseRepository<MusicStyle> {
  constructor() {
    super(prisma, "musicStyle");
  }
  /**
   * Trouve par slug
   */
  async findBySlug(slug: string): Promise<MusicStyle | null> {
    return this.findOne({ slug });
  }

  /**
   * Trouve par catégorie
   */
  async findByCategory(
    category: string,
    activeOnly: boolean = true
  ): Promise<MusicStyle[]> {
    const where: any = { category };
    if (activeOnly) {
      where.active = true;
    }

    return this.findAll({
      where,
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Trouve tous les styles actifs
   */
  async findAllActive(): Promise<MusicStyle[]> {
    return this.findAll({
      where: { active: true },
      orderBy: { order: Order.ASC },
    });
  }

  /**
   * Recherche par nom
   */
  async search(query: string): Promise<MusicStyle[]> {
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
    const styles = await prisma.musicStyle.findMany({
      where: { active: true },
      distinct: ["category"],
      select: { category: true },
    });

    return styles
      .map((s) => s.category)
      .filter((c): c is string => c !== null)
      .sort();
  }
}
