import dotenv from "dotenv";
import path from "path";

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * Vérifie si une variable d'environnement requise est définie.
 * @param {string} key - Clé de l'environnement
 * @returns {string} - Valeur de la variable
 * @throws {Error} - Si la variable est manquante
 */
const getEnv = (key: string, required: boolean = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(
      `❌ Erreur: La variable d'environnement '${key}' est requise mais non définie.`
    );
  }
  return value ?? "";
};

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", false) || "development",
  PORT: getEnv("PORT", false) || "3000",
  SERVER_URL: getEnv("SERVER_URL"),
  LOG_LEVEL: getEnv("LOG_LEVEL"),

  // JWT
  TOKEN_SECRET: getEnv("TOKEN_SECRET"),

  // Base de données
  DATABASE_URL: getEnv("DATABASE_URL"),
  FRONTEND_URL: getEnv("FRONTEND_URL"),
  ADMIN_URL: getEnv("ADMIN_URL"),

  // MINIO
  MINIO_ENDPOINT: getEnv("MINIO_ENDPOINT", true),
  MINIO_PORT: getEnv("MINIO_PORT", true),
  MINIO_ACCESS_KEY: getEnv("MINIO_ACCESS_KEY", true),
  MINIO_SECRET_KEY: getEnv("MINIO_SECRET_KEY", true),
  MINIO_BUCKET_NAME: getEnv("MINIO_BUCKET_NAME", true),
  MINIO_USE_SSL: getEnv("MINIO_BUCKET_NAME", true),

  // MAIL
  MAILER_API_KEY: getEnv("MAILER_API_KEY", true),
  MAILER_PASS: getEnv("MAILER_PASS", true),
  MAILER_USER: getEnv("MAILER_USER", true),
  MAILER_HOST: getEnv("MAILER_HOST", true),
  MAILER_PORT: getEnv("MAILER_PORT", true),
  MAILER_API_URL: getEnv("MAILER_API_URL", true),
  MAILER_SENDER: getEnv("MAILER_SENDER", true),
  MAILER_SENDER_NAME: getEnv("MAILER_SENDER_NAME", true),
  MAILLER_CONFIRME_RP_TEMPLATE_ID: getEnv(
    "MAILLER_CONFIRME_RP_TEMPLATE_ID",
    true
  ),
  MAILLER_RP_TEMPLATE_ID: getEnv("MAILLER_RP_TEMPLATE_ID", true),
  MAILER_TEMPLATE_ID: getEnv("MAILER_TEMPLATE_ID", true),

  // FIREBASE
  FIREBASE_SERVICE_ACCOUNT: getEnv("FIREBASE_SERVICE_ACCOUNT"),
  FIREBASE_API_KEY: getEnv("FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: getEnv("FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: getEnv("FIREBASE_PROJECT_ID"),

  MEILISEARCH_API_KEY: getEnv("MEILISEARCH_API_KEY"),
  MEILISEARCH_API_URL: getEnv("MEILISEARCH_API_URL"),
};
