import { injectable } from "tsyringe";
import { CommentRepository } from "./comment.repository";
import { TopicRepository } from "../topics/topic.repository";
import {
  CreateCommentDTO,
  CreateReplyDTO,
  UpdateCommentDTO,
} from "./comment.dto";
import createError from "http-errors";
import { ReplyRepository } from "./reply.repository";

@injectable()
export class CommentService {
  constructor(
    private commentRepository: CommentRepository,
    private topicRepository: TopicRepository,
    private replyRepository: ReplyRepository
  ) {}

  async create(data: CreateCommentDTO & { authorId: number }) {
    try {
      await this.checkTopic(data.topicId);
      return await this.commentRepository.create(data);
    } catch (error) {
      throw createError(500, `Failed to create comment: ${error.message}`);
    }
  }

  async updateComment(
    commentId: number,
    data: UpdateCommentDTO,
    userId: number
  ) {
    try {
      const promiseTopic = data.topicId
        ? this.checkTopic(data.topicId)
        : Promise.resolve();
      const [comment] = await Promise.all([
        this.checkComment(commentId),
        promiseTopic,
      ]);
      if (comment.authorId !== userId)
        throw createError(401, "Unauthorized action");
      return await this.commentRepository.update(commentId, data);
    } catch (error) {
      throw createError(500, `Failed to update comment: ${error.message}`);
    }
  }

  async removeComment(commentId: number, userId: number) {
    const comment = await this.checkComment(commentId);
    if (comment.authorId !== userId)
      throw createError(401, "Unauthorized action");
    return await this.commentRepository.delete(commentId);
  }

  async findCommentByTopicId(
    topicId: number,
    params: { limit: number; page: number }
  ) {
    const { limit, page } = params;
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.commentRepository.findByTopic(topicId, {
        take: limit,
        skip,
      }),
      this.commentRepository.count({ topicId }),
    ]);

    return {
      data: comments,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async createReply(data: CreateReplyDTO & { authorId: number }) {
    try {
      await this.checkComment(data.commentId);
      return await this.replyRepository.create(data);
    } catch (error) {
      throw createError(500, `Failed to create reply: ${error.message}`);
    }
  }

  async getRepliesByComment(
    commentId: number,
    params: { limit: number; page: number }
  ) {
    const { limit, page } = params;
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.replyRepository.getRepliesByComment(commentId, {
        take: limit,
        skip,
      }),
      this.replyRepository.count({ commentId }),
    ]);

    return {
      data: comments,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async getReply(replyId: number) {
    const reply = await this.replyRepository.findOne(replyId);
    if (!reply) throw createError(404, "reply not found");
    return reply;
  }

  async removeReply(replyId: number, userId: number) {
    const reply = await this.getReply(replyId);
    if (reply.authorId !== userId)
      throw createError(401, "Unauthorized action");
    return await this.replyRepository.delete(replyId);
  }

  async likeComment(userId: number, commentId: number) {
    try {
      await this.checkComment(commentId);
      return await this.commentRepository.likeComment(userId, commentId);
    } catch (error) {
      if (error.code === "P2002") {
        throw createError(400, "You already liked this comment.");
      }
      throw error;
    }
  }
  async likeReply(userId: number, replyId: number) {
    try {
      await this.checkComment(replyId);
      return await this.replyRepository.likeReply(userId, replyId);
    } catch (error) {
      if (error.code === "P2002") {
        throw createError(400, "You already liked this comment.");
      }
      throw error;
    }
  }

  async unlikeComment(userId: number, commentId: number) {
    try {
      await this.checkComment(commentId);
      return await this.commentRepository.unlikeComment(userId, commentId);
    } catch (error) {
      throw error;
    }
  }
  async unlikeReply(userId: number, replyId: number) {
    try {
      await this.checkComment(replyId);
      return await this.replyRepository.unlikeReply(userId, replyId);
    } catch (error) {
      throw error;
    }
  }

  private async checkTopic(topicId: number) {
    const topic = await this.topicRepository.findOne(topicId);
    if (!topic) throw createError(404, "topic not found");
    return topic;
  }

  private async checkComment(commentId: number) {
    const comment = await this.commentRepository.findOne(commentId);
    if (!comment) throw createError(404, "comment not found");
    return comment;
  }
}
