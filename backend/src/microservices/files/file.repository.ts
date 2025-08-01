import DatabaseService from "@/utils/services/database.service";
import { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateFileDTO } from "./file.dto";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class FileRepository {
  async createFile(data: CreateFileDTO & { profileId: number }) {
    return prisma.file.create({
      data,
    });
  }
}
