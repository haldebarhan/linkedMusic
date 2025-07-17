import logger from "@/config/logger";
import { PrismaClient } from "@prisma/client";

export class DatabaseService {
    private static prisma: PrismaClient;

    /**
     * Initialise la connexion à PostgreSQL avec Prisma
     */
    public static async initPostgreSQL() {
        if (!DatabaseService.prisma) {
            DatabaseService.prisma = new PrismaClient();
            logger.info("✅ PostgreSQL connecté via Prisma");

            // Vérification de la connexion
            try {
                await DatabaseService.prisma.$connect();
            } catch (error) {
                logger.error("❌ Erreur de connexion à PostgreSQL:", error);
                process.exit(1);
            }
        }
    }

    /**
     * Récupère l'instance de PrismaClient
     */
    public static getPrismaClient(): PrismaClient {
        if (!DatabaseService.prisma) {
            throw new Error(
                '⚠️ PrismaClient non initialisé. Appelle `initPostgreSQL()` en premier.'
            );
        }
        return DatabaseService.prisma;
    }

    /**
     * Ferme la connexion à PostgreSQL et Redis proprement
     */
    public static async disconnect() {
        if (DatabaseService.prisma) {
            await DatabaseService.prisma.$disconnect();
            logger.info('🛑 Connexion PostgreSQL fermée');
        }
    }
}

DatabaseService.initPostgreSQL();
export default DatabaseService;
