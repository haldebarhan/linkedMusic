import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import createError from "http-errors";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

/**
 * Transforme les query params en where Prisma.
 * - Catégorie: via slug
 * - serviceType: id ou slug (NEW)
 * - Prix natif: priceMin/priceMax (NEW)
 * - Champs dynamiques: via AnnValues selon Field.inputType (inchangé)
 */

export const buildWhere = async (
  categorySlug: string,
  query: Record<string, any>
) => {
  // 1) catégorie
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });
  if (!category) throw createError(404, "Category not found");
  const AND: any[] = [{ categoryId: category.id }];

  // 2) serviceType (id ou slug)  // NEW
  const serviceType =
    query.serviceType ?? query.serviceTypeId ?? query.serviceTypeSlug;
  if (serviceType !== undefined && serviceType !== "") {
    const n = Number(serviceType);
    if (!Number.isNaN(n)) {
      AND.push({ serviceTypeId: n });
    } else {
      AND.push({ serviceType: { slug: String(serviceType) } });
    }
  }

  // 3) prix natif sur announcement (NEW)
  const priceMin = query.priceMin ?? query["price_min"];
  const priceMax = query.priceMax ?? query["price_max"];
  if (priceMin) AND.push({ price: { gte: Number(priceMin) } });
  if (priceMax) AND.push({ price: { lte: Number(priceMax) } });

  // 4) Champs dynamiques AnnValues
  //    - on ne prend pas les clés techniques
  const ignore = new Set([
    "page",
    "limit",
    "q",
    "sort",
    "serviceType",
    "serviceTypeId",
    "serviceTypeSlug",
    "priceMin",
    "priceMax",
    "price_min",
    "price_max",
  ]);
  const keys = Object.keys(query).filter((k) => !ignore.has(k));

  // Charge uniquement les fields présents dans la query
  const fields = await prisma.field.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true, inputType: true },
  });

  for (const f of fields) {
    const raw = query[f.key];
    if (raw === undefined) continue;

    // normalise en tableau (utile pour multi)
    const values = Array.isArray(raw) ? raw : [raw];

    if (f.inputType === "TOGGLE") {
      const val = ["true", "1", 1, true, "on"].includes(values[0]);
      AND.push({
        AnnValues: { some: { fieldId: f.id, valueBoolean: val } },
      });
    } else if (f.inputType === "NUMBER" || f.inputType === "RANGE") {
      // convention côté front: keyMin/keyMax
      const min = query[`${f.key}Min`];
      const max = query[`${f.key}Max`];
      if (min || max) {
        AND.push({
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
      AND.push({
        AnnValues: {
          some: {
            fieldId: f.id,
            options: { some: { option: { value: values[0] } } },
          },
        },
      });
    } else if (f.inputType === "MULTISELECT" || f.inputType === "CHECKBOX") {
      AND.push({
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
      // TEXT/TEXTAREA
      AND.push({
        AnnValues: {
          some: {
            fieldId: f.id,
            valueText: { contains: String(values[0]), mode: "insensitive" },
          },
        },
      });
    }
  }

  return { AND };
};
