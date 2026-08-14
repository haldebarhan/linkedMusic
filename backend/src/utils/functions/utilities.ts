import { ENV } from "../../config/env";
import { Order } from "../enums/order.enum";
import { PaginationParams } from "../interfaces/pagination";
import { S3Service } from "../services/s3.service";
import crypto from "crypto";
const minioService: S3Service = S3Service.getInstance();

export function generateRandomUUID() {
  return crypto.randomUUID();
}

export const generateUrl = async (files: string[]) => {
  if (!files || files.length === 0) return [];
  return Promise.all(
    files.map((file) =>
      minioService.generatePresignedUrl(ENV.AWS_S3_DEFAULT_BUCKET, file),
    ),
  );
};

export const normalize = (str: string): string => {
  return str
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .trim();
};

export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


export const normalizeMediaType = (mediaType: string): string => {
  if (mediaType.startsWith("image")) return "image";
  if (mediaType.startsWith("video")) return "video";
  return mediaType;
};

export const parsePaginationParams = (query: Record<string, unknown>) => {

  const limitRaw = query.limit;
  const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : 10;
  const normalizedLimit = Math.max(isNaN(limit) ? 10 : limit, 10);

  const cursorRaw = query.cursor;
  const cursor = typeof cursorRaw === 'string' ? parseInt(cursorRaw, 10) : undefined;
  const validCursor = cursor !== undefined && !isNaN(cursor) ? cursor : undefined;

  const orderRaw = query.order;
  const order = orderRaw === Order.ASC || orderRaw === Order.DESC
    ? orderRaw
    : Order.DESC;

  const { cursor: _c, limit: _l, order: _o, ...whereRaw } = query;
  const where = Object.entries(whereRaw).reduce((acc, [key, value]) => {
    if (value === 'true') acc[key] = true;
    else if (value === 'false') acc[key] = false;
    else acc[key] = value;
    return acc;
  }, {} as Record<string, unknown>);

  return {
    limit: normalizedLimit,
    cursor: validCursor,
    sortOrder: order,
    where,
  };
}