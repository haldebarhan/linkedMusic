import { ENV } from "@/config/env";
import { MinioService } from "../services/minio.service";

const minioService: MinioService = MinioService.getInstance();

export const saveFileToBucket = async (
  path: string,
  file: Express.Multer.File
) => {
  const bucketName = ENV.MINIO_BUCKET_NAME;
  const objectName = `zikdev/${path}/${file.originalname}`;
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
      const objectName = `zikdev/${path}/${file.originalname}`;
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

export const saveAnnouncementFiles = async (
  files: Express.Multer.File[]
): Promise<{ images: string[]; audios: string[]; videos: string[] }> => {
  const images: string[] = [];
  const audios: string[] = [];
  const videos: string[] = [];
  const bucketName = ENV.MINIO_BUCKET_NAME;

  for (const file of files) {
    const objectName = `zikdev/announcements/${file.originalname}`;
    const metaData = {
      "Content-Type": file.mimetype,
    };

    const fileBuffer = file.buffer;
    await minioService.uploadFile(bucketName, objectName, fileBuffer, metaData);

    if (file.mimetype.startsWith("image")) {
      images.push(objectName);
    } else if (file.mimetype.startsWith("audio")) {
      audios.push(objectName);
    } else if (file.mimetype.startsWith("video")) {
      videos.push(objectName);
    }
  }

  return { images, audios, videos };
};

export const saveSlideFiles = async (file: Express.Multer.File) => {
  const bucketName = ENV.MINIO_BUCKET_NAME;
  const objectName = `zikdev/slides/${file.originalname}`;
  const metaData = {
    "Content-Type": file.mimetype,
  };
  const fileBuffer = file.buffer;
  await minioService.uploadFile(bucketName, objectName, fileBuffer, metaData);
  return { mediaType: file.mimetype, mediaUrl: objectName };
};
