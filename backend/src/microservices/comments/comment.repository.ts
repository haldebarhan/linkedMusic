import { BaseRepository } from "@/utils/classes/base.repoository";
import { Comment, PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { CreateCommentDTO, UpdateCommentDTO } from "./comment.dto";
import DatabaseService from "@/utils/services/database.service";
import { Order } from "@/utils/enums/order.enum";

const prisma: PrismaClient = DatabaseService.getPrismaClient();

@injectable()
export class CommentRepository extends BaseRepository<
  Comment,
  CreateCommentDTO & { authorId: number },
  UpdateCommentDTO & { authorId?: number }
> {
  constructor() {
    super(prisma.comment);
  }

  async findByTopic(
    topicId: number,
    params: {
      skip?: number;
      take?: number;
    }
  ) {
    const { take, skip } = params;
    return prisma.comment.findMany({
      skip,
      take,
      where: { topicId },
      orderBy: { createdAt: Order.ASC },
      include: {
        author: true,
        replies: {
          include: {
            author: true,
          },
        },
      },
    });
  }

  async likeComment(userId: number, commentId: number) {
    return await prisma.commentLike.create({
      data: {
        userId,
        commentId,
      },
    });
  }

  async unlikeComment(userId: number, commentId: number) {
    return await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });
  }
}
