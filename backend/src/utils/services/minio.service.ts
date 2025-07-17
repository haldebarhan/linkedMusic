import * as Minio from 'minio';
import fs from 'fs';
import logger from '@/config/logger';
import { ENV } from '@/config/env';

export class MinioService {
	private readonly minioClient: Minio.Client;
	private static instance: MinioService;

	private constructor() {
		this.minioClient = new Minio.Client({
			endPoint: ENV.MINIO_ENDPOINT,
			port: parseInt(ENV.MINIO_PORT || '9000', 10),
			useSSL: ENV.MINIO_USE_SSL === 'true',
			accessKey: ENV.MINIO_ACCESS_KEY,
			secretKey: ENV.MINIO_SECRET_KEY,
		});

		logger.info('MinioService initialisé avec succès');
	}

	/**
	 * Obtient l'instance unique du MinioService (pattern Singleton)
	 * @returns L'instance unique de MinioService
	 */
	public static getInstance(): MinioService {
		if (!MinioService.instance) {
			MinioService.instance = new MinioService();
		}
		return MinioService.instance;
	}

	/**
	 * Vérifie si un bucket existe
	 * @param bucketName Nom du bucket
	 * @returns true si le bucket existe, false sinon
	 */
	async bucketExists(bucketName: string): Promise<boolean> {
		try {
			const exists = await this.minioClient.bucketExists(bucketName);
			logger.info(
				`Vérification du bucket ${bucketName}: ${exists ? 'existe' : "n' existe pas"}`
			);
			return exists;
		} catch (error) {
			logger.error(
				`Erreur lors de la vérification du bucket ${bucketName}`,
				{ error: error.message }
			);
			throw error;
		}
	}

	/**
	 * Crée un bucket si celui-ci n'existe pas
	 * @param bucketName Nom du bucket
	 */
	async createBucketIfNotExists(bucketName: string): Promise<void> {
		try {
			const exists = await this.bucketExists(bucketName);
			if (!exists) {
				await this.minioClient.makeBucket(bucketName, 'us-east-1');
				logger.info(`Bucket ${bucketName} créé avec succès.`);
			} else {
				logger.info(`Bucket ${bucketName} existe déjà.`);
			}
		} catch (error) {
			logger.error(`Erreur lors de la création du bucket ${bucketName}`, {
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Upload un fichier vers Minio
	 * @param bucketName Nom du bucket
	 * @param objectName Nom de l'objet (chemin dans Minio)
	 * @param fileBuffer Buffer contenant les données du fichier
	 * @param metaData Métadonnées optionnelles
	 */
	async uploadFile(
		bucketName: string,
		objectName: string,
		fileBuffer: Buffer,
		metaData?: any
	): Promise<void> {
		try {
			await this.createBucketIfNotExists(bucketName);

			await this.minioClient.putObject(
				bucketName,
				objectName,
				fileBuffer,
				metaData
			);
			logger.info(
				`Fichier ${objectName} uploadé avec succès dans ${bucketName}.`
			);
		} catch (error) {
			logger.error(
				`Erreur lors de l'upload de ${objectName} dans ${bucketName}`,
				{ error: error.message }
			);
			throw error;
		}
	}

	/**
	 * Télécharge un fichier depuis Minio
	 * @param bucketName Nom du bucket
	 * @param objectName Nom de l'objet dans Minio
	 * @param downloadPath Chemin local de destination
	 */
	async downloadFile(
		bucketName: string,
		objectName: string,
		downloadPath: string
	): Promise<void> {
		try {
			const fileStream = await this.minioClient.getObject(
				bucketName,
				objectName
			);
			const writeStream = fs.createWriteStream(downloadPath);

			fileStream.pipe(writeStream);

			fileStream.on('end', () => {
				logger.info(
					`Fichier ${objectName} téléchargé avec succès dans ${downloadPath}`
				);
			});
		} catch (error) {
			logger.error(`Erreur lors du téléchargement de ${objectName}`, {
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Supprime un fichier de Minio
	 * @param bucketName Nom du bucket
	 * @param objectName Nom de l'objet à supprimer
	 */
	async deleteFile(bucketName: string, objectName: string): Promise<void> {
		try {
			await this.minioClient.removeObject(bucketName, objectName);
			logger.info(
				`Fichier ${objectName} supprimé avec succès de ${bucketName}.`
			);
		} catch (error) {
			logger.error(`Erreur lors de la suppression de ${objectName}`, {
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Génère une URL pré-signée pour télécharger un fichier
	 * @param bucketName Nom du bucket
	 * @param objectName Nom de l'objet
	 * @param expiry Durée en secondes avant expiration de l'URL
	 * @returns URL pré-signée
	 */
	async generatePresignedUrl(
		bucketName: string,
		objectName: string,
		expiry: number = 24 * 60 * 60
	): Promise<string> {
		try {
			const url = await this.minioClient.presignedGetObject(
				bucketName,
				objectName,
				expiry
			);
			logger.info(`URL pré-signée générée avec succès pour ${objectName}`);
			return url;
		} catch (error) {
			logger.error(
				`Erreur lors de la génération de l'URL pour ${objectName}`,
				{ error: error.message }
			);
			throw error;
		}
	}
}
