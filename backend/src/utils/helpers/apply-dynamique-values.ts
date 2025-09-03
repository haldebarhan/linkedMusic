import { FieldInputType, Prisma, PrismaClient } from "@prisma/client";
import { toArray, toBool } from "../functions/utilities";
import { MeiliDoc } from "../services/search.service";
import DatabaseService from "../services/database.service";
const prisma: PrismaClient = DatabaseService.getPrismaClient();

type FieldsByKey = Map<
  string,
  {
    sf: { required: boolean; visibleInForm: boolean };
    field: {
      id: number;
      key: string;
      inputType: FieldInputType;
      options: Array<{ id: number; value: string }>;
    };
  }
>;

export async function applyDynamicValues(args: {
  tx: Prisma.TransactionClient;
  announcementId: number;
  values: Record<string, any>;
  fieldsByKey: FieldsByKey;
  mode: "create" | "replace-keys";
}) {
  const { tx, announcementId, values, fieldsByKey, mode } = args;

  for (const [key, raw] of Object.entries(values)) {
    const meta = fieldsByKey.get(key);
    if (!meta) {
      // Le champ n'est pas attaché à ce ServiceType → on ignore (ou throw si tu préfères)
      continue;
    }
    const { field } = meta;

    // Si 'replace-keys', on supprime les valeurs existantes pour ce field
    if (mode === "replace-keys") {
      const existing = await tx.annFieldValue.findUnique({
        where: {
          announcementId_fieldId: { announcementId, fieldId: field.id },
        },
        select: { id: true },
      });
      if (existing) {
        await tx.annFieldValueOption.deleteMany({
          where: { annFieldValueId: existing.id },
        });
        await tx.annFieldValue.delete({ where: { id: existing.id } });
      }
    }

    // Créer la base (une ligne par field)
    const base = await tx.annFieldValue.create({
      data: { announcementId, fieldId: field.id },
    });

    switch (field.inputType) {
      case "NUMBER":
      case "RANGE": {
        const n = Number(raw);
        if (Number.isNaN(n)) throw new Error(`Field ${key} expects a number`);
        await tx.annFieldValue.update({
          where: { id: base.id },
          data: { valueNumber: n },
        });
        break;
      }
      case "TOGGLE": {
        const b = toBool(raw);
        await tx.annFieldValue.update({
          where: { id: base.id },
          data: { valueBoolean: b },
        });
        break;
      }
      case "SELECT":
      case "RADIO": {
        const v = String(raw);
        const opt = field.options.find((o) => o.value === v);
        if (!opt) throw new Error(`Field ${key}: unknown option "${v}"`);
        await tx.annFieldValueOption.create({
          data: { annFieldValueId: base.id, optionId: opt.id },
        });
        break;
      }
      case "MULTISELECT":
      case "CHECKBOX": {
        const arr = toArray(raw);
        if (!arr.length) break;
        const map = new Map(field.options.map((o) => [o.value, o.id]));
        const optionIds = arr
          .map((v) => map.get(String(v)))
          .filter((id): id is number => typeof id === "number");
        if (!optionIds.length) break;
        await tx.annFieldValueOption.createMany({
          data: optionIds.map((optionId) => ({
            annFieldValueId: base.id,
            optionId,
          })),
        });
        break;
      }
      case "TEXT":
      case "TEXTAREA":
      default: {
        await tx.annFieldValue.update({
          where: { id: base.id },
          data: { valueText: String(raw) },
        });
        break;
      }
    }
  }
}

export const buildDocForIndex = async (id: number): Promise<MeiliDoc> => {
  const a = await prisma.announcement.findUniqueOrThrow({
    where: { id },
    include: {
      serviceType: {
        select: { slug: true, category: { select: { slug: true } } },
      },
      AnnValues: {
        include: { field: true, options: { include: { option: true } } },
      },
    },
  });

  // aplatir EAV → doc Meili
  const doc: MeiliDoc = {
    id: a.id,
    title: a.title,
    excerpt: a.description?.slice(0, 200) ?? "",
    category: a.serviceType.category.slug,
    serviceType: a.serviceType.slug,
    price: a.price ?? undefined,
    city: a.location ?? undefined,
    createdAt: Math.floor(a.createdAt.getTime() / 1000),
    updatedAt: Math.floor(a.updatedAt.getTime() / 1000),
  };

  for (const v of a.AnnValues) {
    const key = v.field.key;
    switch (v.field.inputType) {
      case "NUMBER":
      case "RANGE":
        (doc as any)[key] = v.valueNumber ?? null;
        break;
      case "TOGGLE":
        (doc as any)[key] = !!v.valueBoolean;
        break;
      case "SELECT":
      case "RADIO":
        (doc as any)[key] = v.options[0]?.option.value ?? null;
        break;
      case "MULTISELECT":
      case "CHECKBOX":
        (doc as any)[key] = v.options.map((o) => o.option.value);
        break;
      default:
        (doc as any)[key] = v.valueText ?? null;
    }
  }
  return doc;
};

export const mapSort = (sort?: string): string[] | undefined => {
  switch (sort) {
    case "price-asc":
      return ["price:asc"];
    case "price-desc":
      return ["price:desc"];
    case "date-asc":
      return ["createdAt:asc"];
    case "date-desc":
    default:
      return ["createdAt:desc"];
  }
};

export const prismaOrderFromSort = (sort?: string) => {
  switch (sort) {
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    case "date-asc":
      return { createdAt: "asc" as const };
    case "date-desc":
    default:
      return { createdAt: "desc" as const };
  }
};
