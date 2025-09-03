import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import createError from "http-errors";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

/**
 * Transforme des query params en conditions Prisma basées sur Field.key
 * ex: { styles: ['rock','jazz'], pro: 'true', priceMin: '50', priceMax: '300' }
 */
export const buildWhere = async (
  categorySlug: string,
  query: Record<string, any>
) => {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });
  if (!category) throw createError(404, "Category not found");
  const whereAND: any[] = [{ categoryId: category.id }];

  // Charger les fields concernés par les filtres (par leurs keys présentes dans query)
  const keys = Object.keys(query).filter(
    (k) => !["page", "q", "sort"].includes(k)
  );
  const fields = await prisma.field.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, inputType: true },
  });

  for (const f of fields) {
    const raw = query[f.key];
    if (raw === undefined) continue;

    // normalise la valeur en tableau (utile pour multi)
    const values = Array.isArray(raw) ? raw : [raw];

    if (f.inputType === "TOGGLE") {
      const val = ["true", "1", 1, true, "on"].includes(values[0]);
      whereAND.push({
        AnnValues: {
          some: { fieldId: f.id, valueBoolean: val },
        },
      });
    } else if (f.inputType === "NUMBER" || f.inputType === "RANGE") {
      const min = query[`${f.key}Min`];
      const max = query[`${f.key}Max`];
      if (min || max) {
        whereAND.push({
          AnnValues: {
            some: {
              fieldId: f.id,
              valueNumber: {
                gte: min ? Number(min) : undefined,
                lte: max ? Number(max) : undefined,
              },
            },
          },
        });
      }
    } else if (f.inputType === "SELECT" || f.inputType === "RADIO") {
      whereAND.push({
        AnnValues: {
          some: {
            fieldId: f.id,
            options: { some: { option: { value: values[0] } } },
          },
        },
      });
    } else if (f.inputType === "MULTISELECT" || f.inputType === "CHECKBOX") {
      // au moins une des valeurs
      whereAND.push({
        AnnValues: {
          some: {
            fieldId: f.id,
            options: {
              some: { option: { value: { in: values as string[] } } },
            },
          },
        },
      });
    } else {
      // TEXT/TEXTAREA: contient
      whereAND.push({
        AnnValues: {
          some: {
            fieldId: f.id,
            valueText: { contains: String(values[0]), mode: "insensitive" },
          },
        },
      });
    }
  }

  return { AND: whereAND };
};
