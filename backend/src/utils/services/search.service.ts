// src/utils/services/search.service.ts
import { MeiliSearch } from "meilisearch";
import { ENV } from "@/config/env";

const client = new MeiliSearch({
  host: ENV.MEILISEARCH_API_URL,
  apiKey: ENV.MEILISEARCH_API_KEY,
});

const INDEX_NAME = "announcements";
const index = client.index(INDEX_NAME);

// ---- Helper universel : attend la fin de la tâche Meili quelle que soit la version du SDK
type MeiliTask = { taskUid?: number; updateId?: number };

async function waitTask(task: MeiliTask, timeoutMs = 30_000, intervalMs = 100) {
  const anyClient = client as any;
  const anyIndex = index as any;

  // 1) Nouvelle API (client.waitForTask)
  if (task?.taskUid != null && typeof anyClient.waitForTask === "function") {
    await anyClient.waitForTask(task.taskUid, { timeOutMs: timeoutMs });
    return;
  }
  // 2) Nouvelle API (index.waitForTask)
  if (task?.taskUid != null && typeof anyIndex.waitForTask === "function") {
    await anyIndex.waitForTask(task.taskUid, { timeOutMs: timeoutMs });
    return;
  }
  // 3) Ancienne API (index.waitForPendingUpdate / updateId)
  if (
    task?.updateId != null &&
    typeof anyIndex.waitForPendingUpdate === "function"
  ) {
    await anyIndex.waitForPendingUpdate(task.updateId, {
      timeOutMs: timeoutMs,
    });
    return;
  }
  // 4) Fallback polling (nouvelle API: client.getTask)
  if (task?.taskUid != null && typeof anyClient.getTask === "function") {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const t = await anyClient.getTask(task.taskUid);
      if (t.status === "succeeded") return;
      if (t.status === "failed")
        throw new Error(`Meili task failed: ${t?.error?.message ?? ""}`);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("Timeout waiting for Meili task");
  }
  // 5) Rien de dispo → ne bloque pas (best-effort)
}

// ---- Service
export type MeiliDoc = {
  id: number | string;
  title: string;
  [k: string]: any;
};

export class SearchService {
  /** Idempotent : crée l’index si besoin (sans settings) */
  static async init() {
    await client.createIndex(INDEX_NAME, { primaryKey: "id" }).catch(() => {});
  }

  /** Upsert 1 document */
  static async addOrUpdate(doc: MeiliDoc) {
    const task = await index.addDocuments([doc]);
    await waitTask(task);
  }

  /** Upsert plusieurs documents */
  static async addMany(docs: MeiliDoc[]) {
    const task = await index.addDocuments(docs);
    await waitTask(task);
  }

  /** Update (équivaut à addDocuments côté Meili) */
  static async update(doc: MeiliDoc) {
    const task = await index.updateDocuments([doc]);
    await waitTask(task);
  }

  /** Suppression par id */
  static async deleteById(id: number | string) {
    const task = await index.deleteDocument(id);
    await waitTask(task);
  }

  /** Réindexation complète */
  static async clearAndSync(allDocs: MeiliDoc[]) {
    await waitTask(await index.deleteAllDocuments());
    await waitTask(await index.addDocuments(allDocs));
  }

  /** Recherche (page/hitsPerPage si dispo, sinon limit/offset fonctionnera aussi) */
  static async searchPaged(
    query: string,
    opts?: {
      filters?: string | string[];
      sort?: string[];
      page?: number;
      hitsPerPage?: number;
      facets?: string[];
    }
  ) {
    const { page = 1, hitsPerPage = 12, filters, sort, facets } = opts || {};
    return index.search(query ?? "", {
      page,
      hitsPerPage,
      filter: filters,
      sort,
      facets,
    } as any); // cast pour supporter les variantes de SDK
  }
}
