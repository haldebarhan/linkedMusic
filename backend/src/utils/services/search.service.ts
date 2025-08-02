import { ENV } from "@/config/env";
import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: ENV.MEILISEARCH_API_URL,
  apiKey: ENV.MEILISEARCH_API_KEY,
});

const index = client.index("announcements");

export class SearchService {
  static async addAnnouncement(announcements: any) {
    return await index.addDocuments([announcements], { primaryKey: "id" });
  }
  static async search(
    query: string,
    option?: {
      filters?: string;
      sort?: string[];
      limit?: number;
      offset?: number;
    }
  ) {
    return await index.search(query, {
      filter: option?.filters,
      sort: option?.sort,
      limit: option?.limit,
      offset: option?.offset,
    });
  }
  static async deleteAnnouncement(id: number) {
    return await index.deleteDocument(id);
  }

  static async updateAnnouncement(announcement: any) {
    return await index.updateDocuments([announcement]);
  }

  static async deleteById(id: number) {
    await index.deleteDocument(id);
  }

  static async syncFromDatabase(data: any[]) {
    await index.deleteAllDocuments();
    return await index.addDocuments(data, { primaryKey: "id" });
  }
}
