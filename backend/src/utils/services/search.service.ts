// src/utils/services/search.service.ts
import { MeiliSearch } from "meilisearch";
import { ENV } from "@/config/env";
import createError from "http-errors";

// ---------- Client & index ----------
const INDEX_NAME = "announcements";

const client = new MeiliSearch({
  host: ENV.MEILISEARCH_API_URL,
  apiKey: ENV.MEILISEARCH_API_KEY,
});
const index = client.index(INDEX_NAME);

// ---------- Wait task universel ----------
type MeiliTask = { taskUid?: number; updateId?: number };
async function waitTask(task: MeiliTask, timeoutMs = 30_000, intervalMs = 100) {
  const anyClient = client as any;
  const anyIndex = index as any;

  if (task?.taskUid != null && typeof anyClient.waitForTask === "function") {
    await anyClient.waitForTask(task.taskUid, { timeOutMs: timeoutMs });
    return;
  }
  if (task?.taskUid != null && typeof anyIndex.waitForTask === "function") {
    await anyIndex.waitForTask(task.taskUid, { timeOutMs: timeoutMs });
    return;
  }
  if (
    task?.updateId != null &&
    typeof anyIndex.waitForPendingUpdate === "function"
  ) {
    await anyIndex.waitForPendingUpdate(task.updateId, {
      timeOutMs: timeoutMs,
    });
    return;
  }
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
}

// ---------- Settings souhaitées ----------
const SEARCHABLE = [
  "title",
  "description",
  "tag",
  "location",
  "serviceType", // string (ex: slug/label), utile pour le search plein-texte
  "instrument",
  "niveau",
  "styles",
  "category", // compat éventuelle si tu avais un champ string unique
  "status",
];

const FILTERABLE = [
  "location",
  "price",
  "tag",
  "serviceTypeId",
  "serviceType",
  "instrument",
  "niveau",
  "isPublished",
  "isHighlighted",
  "styles",
  "category",
  "status",
];

const SORTABLE = [
  "title",
  "createdAt",
  "price",
  "location",
  "serviceTypeId",
  "instrument",
];

// utilitaires petite comparaison (ordre non pris en compte)
function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

// ---------- Service ----------
export type MeiliDoc = {
  id: number | string;
  title: string;
  [k: string]: any;
};

export class SearchService {
  /** Idempotent : crée l’index si besoin et configure les settings */
  static async initAndConfigure() {
    // 1) crée l’index si absent
    try {
      await client.createIndex(INDEX_NAME, { primaryKey: "id" });
    } catch {
      /* ignore if exists */
    }

    // 2) applique les settings en une fois si la config diverge
    // Certaines versions du SDK renvoient `getSettings()`, sinon on pousse directement.
    try {
      const current = (await (index as any).getSettings?.()) || {};
      const needSearchable =
        !current.searchableAttributes ||
        !sameSet(current.searchableAttributes, SEARCHABLE);
      const needFilterable =
        !current.filterableAttributes ||
        !sameSet(current.filterableAttributes, FILTERABLE);
      const needSortable =
        !current.sortableAttributes ||
        !sameSet(current.sortableAttributes, SORTABLE);

      if (needSearchable || needFilterable || needSortable) {
        const task = await index.updateSettings({
          searchableAttributes: SEARCHABLE,
          filterableAttributes: FILTERABLE,
          sortableAttributes: SORTABLE,
        });
        await waitTask(task);
      }
    } catch {
      // Fallback: pousser chaque famille séparément (versions anciennes)
      await waitTask(await index.updateSearchableAttributes(SEARCHABLE as any));
      await waitTask(await index.updateFilterableAttributes(FILTERABLE as any));
      await waitTask(await index.updateSortableAttributes(SORTABLE as any));
    }
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

  /** Update (équivaut souvent à addDocuments côté Meili) */
  static async update(doc: MeiliDoc) {
    const task = await index.updateDocuments([doc]);
    await waitTask(task);
  }

  /** Récupère un document par son ID */
  static async getDocument(id: number): Promise<MeiliDoc> {
    const document = await index.getDocument(id);
    if (!document) throw createError(404, "Document not found");
    return document as MeiliDoc;
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

  /** Recherche paginée */
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
    } as any);
  }
  static async clearDoc() {
    await waitTask(await index.deleteAllDocuments());
  }
}
