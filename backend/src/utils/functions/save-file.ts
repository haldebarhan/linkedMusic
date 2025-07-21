import { ENV } from "@/config/env";
import { MinioService } from "../services/minio.service";

const minioService: MinioService = MinioService.getInstance();

export const saveFileToBucket = async (
  path: string,
  file: Express.Multer.File
) => {
  const bucketName = ENV.MINIO_BUCKET_NAME;
  const objectName = `zikdev/${path}/${Date.now() + file.originalname}`;
  const metaData = {
    "Content-Type": file.mimetype,
  };
  const fileBuffer = file.buffer;
  await minioService.uploadFile(bucketName, objectName, fileBuffer, metaData);
  return { name: file.originalname, objectName };
};

export const saveFilesToBucket = async (
  path: string,
  files: Express.Multer.File[]
) => {
  const bucketName = ENV.MINIO_BUCKET_NAME;
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const objectName = `zikdev/${path}/${Date.now() + file.originalname}`;
      const metaData = {
        "Content-Type": file.mimetype,
      };
      const fileBuffer = file.buffer;
      await minioService.uploadFile(
        bucketName,
        objectName,
        fileBuffer,
        metaData
      );
      return { name: file.originalname, objectName };
    })
  );
  return uploadedFiles;
};
