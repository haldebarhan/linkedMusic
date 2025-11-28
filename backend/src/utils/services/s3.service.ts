import fs from "fs";
import logger from "@/config/logger";
import { ENV } from "@/config/env";

import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private readonly s3Client: S3Client;
  private static instance: S3Service;

  private constructor() {
    this.s3Client = new S3Client({
      region: ENV.AWS_REGION,
      credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
      },
    });

    logger.info("S3Service initialisé avec succès");
  }

  /**
   * Singleton
   */
  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  /**
   * Vérifie si un bucket existe
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      logger.info(`Bucket ${bucketName} existe.`);
      return true;
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404) {
        logger.warn(`Bucket ${bucketName} n'existe pas.`);
        return false;
      }
      logger.error(`Erreur lors de la vérification du bucket ${bucketName}`, {
        error: error?.message,
      });
      throw error;
    }
  }

  /**
   * Crée un bucket si celui-ci n'existe pas
   * (en pratique, en prod tu le crées manuellement dans AWS, donc cette méthode
   * sert surtout en dev ou pour loguer)
   */
  async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.bucketExists(bucketName);
      if (!exists) {
        await this.s3Client.send(
          new CreateBucketCommand({
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: ENV.AWS_REGION as any,
            },
          })
        );
        logger.info(`Bucket ${bucketName} créé avec succès.`);
      } else {
        logger.info(`Bucket ${bucketName} existe déjà.`);
      }
    } catch (error: any) {
      logger.error(`Erreur lors de la création du bucket ${bucketName}`, {
        error: error?.message,
      });
      throw error;
    }
  }

  /**
   * Upload un fichier vers S3 (en RAM -> S3, rien sur le disque)
   * @param bucketName Nom du bucket
   * @param objectName Chemin/nom de l'objet dans S3
   * @param fileBuffer Buffer du fichier
   * @param metaData  Métadonnées (ex: { "Content-Type": "image/png" })
   */
  async uploadFile(
    bucketName: string,
    objectName: string,
    fileBuffer: Buffer,
    metaData?: Record<string, string>
  ): Promise<void> {
    try {
      // En prod, tu peux enlever ça et considérer que le bucket existe toujours
      await this.createBucketIfNotExists(bucketName);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectName,
          Body: fileBuffer,
          ContentType: metaData?.["Content-Type"],
          Metadata: metaData,
        })
      );

      logger.info(
        `Fichier ${objectName} uploadé avec succès dans ${bucketName} (S3).`
      );
    } catch (error: any) {
      logger.error(
        `Erreur lors de l'upload de ${objectName} dans ${bucketName} (S3)`,
        { error: error?.message }
      );
      throw error;
    }
  }

  /**
   * Télécharge un fichier depuis S3 vers le disque local (si tu en as besoin)
   */
  async downloadFile(
    bucketName: string,
    objectName: string,
    downloadPath: string
  ): Promise<void> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        })
      );

      const bodyStream = response.Body as NodeJS.ReadableStream;
      const writeStream = fs.createWriteStream(downloadPath);

      await new Promise<void>((resolve, reject) => {
        bodyStream
          .pipe(writeStream)
          .on("finish", () => {
            logger.info(
              `Fichier ${objectName} téléchargé avec succès dans ${downloadPath}`
            );
            resolve();
          })
          .on("error", (err) => {
            logger.error(
              `Erreur lors du téléchargement de ${objectName} vers ${downloadPath}`,
              { error: err.message }
            );
            reject(err);
          });
      });
    } catch (error: any) {
      logger.error(`Erreur lors du téléchargement de ${objectName} (S3)`, {
        error: error?.message,
      });
      throw error;
    }
  }

  /**
   * Supprime un fichier de S3
   */
  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        })
      );
      logger.info(
        `Fichier ${objectName} supprimé avec succès de ${bucketName} (S3).`
      );
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression de ${objectName} (S3)`, {
        error: error?.message,
      });
      throw error;
    }
  }

  /**
   * Génère une URL pré-signée pour télécharger un fichier
   */
  async generatePresignedUrl(
    bucketName: string,
    objectName: string,
    expiry: number = 24 * 60 * 60
  ): Promise<string> {
    try {
      const url = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        }),
        { expiresIn: expiry }
      );

      logger.info(`URL pré-signée générée avec succès pour ${objectName} (S3)`);
      return url;
    } catch (error: any) {
      console.log(error);
      logger.error(
        `Erreur lors de la génération de l'URL pour ${objectName} (S3)`,
        {
          error: error?.message,
        }
      );
      throw error;
    }
  }

  /**
   * Alias de generatePresignedUrl pour compatibilité avec ton code existant
   */
  async presignGetUrl(
    bucketName: string,
    objectName: string,
    expiry: number = 24 * 60 * 60
  ) {
    return this.generatePresignedUrl(bucketName, objectName, expiry);
  }
}
