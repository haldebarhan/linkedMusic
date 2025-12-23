import { v4 as uuidv4 } from "uuid";
import { ENV } from "../../config/env";
import { S3Service } from "../services/s3.service";
const minioService: S3Service = S3Service.getInstance();

export function generateRandomUUID() {
  return uuidv4();
}

export const generateUrl = async (files: string[]) => {
  if (!files || files.length === 0) return [];
  return Promise.all(
    files.map((file) =>
      minioService.generatePresignedUrl(ENV.AWS_S3_DEFAULT_BUCKET, file)
    )
  );
};
