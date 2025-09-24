import { UpdateAnnouncementDto } from "@/microservices/annoncements/ann.dto";
import { Prisma, PrismaClient } from "@prisma/client";
import createError from "http-errors";

type UpdateArgs = {
  tx: Prisma.TransactionClient | PrismaClient;
  annId: number;
  base: UpdateAnnouncementDto;
  newFiles: string[];
  fileToRemove: string[];
  fieldName?: "images";
};

export const buildUpdateDTO = async ({
  tx,
  annId,
  base,
  newFiles = [],
  fileToRemove = [],
  fieldName = "images",
}: UpdateArgs): Promise<Prisma.AnnouncementUpdateInput> => {
  const prev = await tx.announcement.findUnique({
    where: { id: annId },
    select: { [fieldName]: true },
  } as any);

  if (!prev) throw createError(404, "Annnouncement not found");

  const current: string[] = (prev as any)[fieldName] ?? [];

  const kept = fileToRemove?.length
    ? current.filter((f) => !fileToRemove.includes(f))
    : current;

  const finalList = [...kept, ...(newFiles ?? [])];

  const dto: Prisma.AnnouncementUpdateInput = {
    ...(base.title ? { title: base.title } : {}),
    ...(base.description ? { description: base.description } : {}),
    ...(base.serviceTypeId != null
      ? { serviceTypeId: base.serviceTypeId }
      : {}),
    ...(base.categoryId != null ? { categoryId: base.categoryId } : {}),
    ...(base.price != null ? { price: base.price } : {}),
    ...(base.location ? { location: base.location } : {}),
    [fieldName]: { set: finalList } as any,
  };
  return dto;
};
