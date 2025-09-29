export const EVENTS = {
  THREADS_LIST: "threads:list", // (client -> server) demander la liste
  THREADS_DATA: "threads:data", // (server -> client) payload threads[]
  THREAD_SELECT: "thread:select", // (client -> server) { threadId }
  CONVO_LOAD: "convo:load", // (client -> server) { threadId, page?, limit? }
  CONVO_DATA: "convo:data", // (server -> client) { threadId, messages, total }
  MESSAGE_SEND: "message:send", // (client -> server) { threadId, content }
  MESSAGE_NEW: "message:new", // (server -> clients) { threadId, message }
  MESSAGE_MARK_READ: "message:markRead", // (client -> server) { threadId }
  NOTIF_UNREAD: "notif:unread", // (server -> client) { total }
  ERROR: "error", // (server -> client) { message }
} as const;
export type EventKey = (typeof EVENTS)[keyof typeof EVENTS];
