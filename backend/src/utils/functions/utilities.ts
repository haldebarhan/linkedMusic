import { ENV } from "../../config/env";
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
