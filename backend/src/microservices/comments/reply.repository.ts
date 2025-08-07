import { BaseRepository } from "@/utils/classes/base.repoository";
import { PrismaClient, Reply } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateReplyDTO, UpdateReplyDTO } from "./comment.dto";
import DatabaseService from "@/utils/services/database.service";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class ReplyRepository extends BaseRepository<
  Reply,
  CreateReplyDTO,
  UpdateReplyDTO
> {
  constructor() {
    super(prisma.reply);
  }

  async getRepliesByComment(
    commentId: number,
    params: {
      skip?: number;
      take?: number;
    }
  ) {
    const { take, skip } = params;
    return prisma.reply.findMany({
      take,
      skip,
      where: { commentId },
      include: {
        author: true,
        likes: true,
        reports: true,
      },
      orderBy: { createdAt: Order.ASC },
    });
  }

  async likeReply(userId: number, replyId: number) {
    return await prisma.replyLike.create({
      data: {
        userId,
        replyId,
      },
    });
  }

  async unlikeReply(userId: number, replyId: number) {
    return await prisma.replyLike.delete({
      where: {
        userId_replyId: {
          userId,
          replyId,
        },
      },
    });
  }
}
