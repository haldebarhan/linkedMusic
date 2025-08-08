import { injectable } from "tsyringe";
import { CommentService } from "./comment.service";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/utils/interfaces/authenticated-request";
import { handleError } from "@/utils/helpers/handle-error";
import {
  CreateCommentDTO,
  CreateReplyDTO,
  UpdateCommentDTO,
} from "./comment.dto";
import { formatResponse } from "@/utils/helpers/response-formatter";

@injectable()
export class CommentController {
  constructor(private commentService: CommentService) {}

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const data: CreateCommentDTO & { authorId: number } = {
        ...req.body,
        authorId: user.id,
      };
      const created = await this.commentService.create(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { id } = req.params;
      const dto: UpdateCommentDTO = Object.assign(
        new UpdateCommentDTO(),
        req.body
      );
      const updated = await this.commentService.updateComment(
        +id,
        dto,
        user.id
      );
      const response = formatResponse(200, updated);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findCommentsByTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page: pageQuery, limit: limitQuery } = req.query;

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);
      const comments = await this.commentService.findCommentByTopicId(+id, {
        limit: limit_query,
        page: page_number,
      });
      const response = formatResponse(200, comments);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async likeComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.body;
      const { user } = req;
      await this.commentService.likeComment(user.id, commentId);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async likeReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.body;
      const { user } = req;
      await this.commentService.likeReply(user.id, commentId);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async unlikeComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.body;
      const { user } = req;
      await this.commentService.unlikeComment(user.id, commentId);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
  async unlikeReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.body;
      const { user } = req;
      await this.commentService.unlikeReply(user.id, commentId);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.commentService.removeComment(+id, user.id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  // Replies

  async createReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const data: CreateReplyDTO & { authorId: number } = {
        ...req.body,
        authorId: user.id,
      };
      const created = await this.commentService.createReply(data);
      const response = formatResponse(201, created);
      res.status(201).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async findRepliesByComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page: pageQuery, limit: limitQuery } = req.query;

      const page = parseInt(pageQuery as string) || 1;
      const limit = parseInt(limitQuery as string) || 10;

      const page_number = Math.max(page, 1);
      const limit_query = Math.max(limit, 10);

      const replies = await this.commentService.getRepliesByComment(+id, {
        limit: limit_query,
        page: page_number,
      });

      const response = formatResponse(200, replies);
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }

  async removeReply(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;
      await this.commentService.removeReply(+id, user.id);
      const response = formatResponse(200, "Operation successfully completed");
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  }
}
