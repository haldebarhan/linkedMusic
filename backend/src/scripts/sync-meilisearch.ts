// import DatabaseService from "@/utils/services/database.service";
// import { SearchService } from "@/utils/services/search.service";
// import { PrismaClient } from "@prisma/client";
// import { JsonValue } from "@prisma/client/runtime/library";
// import { ENV } from "@/config/env";
// import { MeiliSearch } from "meilisearch";
// import logger from "@/config/logger";

// const prisma: PrismaClient = DatabaseService.getPrismaClient();

// export const parseObject = (data: JsonValue) =>
//   data && typeof data === "object" ? { ...data } : {};

// export const flattenArrayValues = (
//   obj: Record<string, any>
// ): Record<string, any> => {
//   const flattened: Record<string, any> = {};

//   for (const [key, value] of Object.entries(obj)) {
//     if (
//       Array.isArray(value) &&
//       value.every((item) => typeof item === "string")
//     ) {
//       // Joindre les strings avec des virgules
//       flattened[key] = value.join(" | ");
//     } else {
//       // Garder la valeur telle quelle
//       flattened[key] = value;
//     }
//   }

//   return flattened;
// };

// const setupIndex = async () => {
//   const client = new MeiliSearch({
//     host: ENV.MEILISEARCH_API_URL,
//     apiKey: ENV.MEILISEARCH_API_KEY,
//   });

//   const index = client.index("announcements");

//   await index.updateSearchableAttributes([
//     "title",
//     "description",
//     "location",
//     "serviceType",
//     "instrument",
//     "niveau",
//     "styles",
//   ]);

//   await index.updateFilterableAttributes([
//     "location",
//     "price",
//     "serviceTypeId",
//     "instrument",
//     "niveau",
//     "isPublished",
//     "isHighlighted",
//     "styles",
//   ]);

//   await index.updateSortableAttributes([
//     "title",
//     "createdAt",
//     "price",
//     "location",
//     "instrument", // si tu veux trier par ça aussi
//     "serviceTypeId",
//     "styles",
//   ]);

//   logger.info("✅ Configuration de l’index Meilisearch terminée.");
// };

// export const syncDbToMeiliSearch = async () => {
//   await setupIndex();
//   const annoncements = await prisma.announcement.findMany({
//     include: { serviceType: true },
//   });

//   await SearchService.syncFromDatabase(
//     annoncements.map((annoncement) => {
//       const { data, ...rest } = annoncement;
//       const parsedData = parseObject(data);
//       const flattenedData = flattenArrayValues(parsedData);
//       return {
//         ...rest,
//         serviceType: annoncement.serviceType.name ?? "",
//         ...flattenedData,
//       };
//     })
//   );
//   logger.info("✅ Annonces synchronisées avec Meilisearch");
// };
