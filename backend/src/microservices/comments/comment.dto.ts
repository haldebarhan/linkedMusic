import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCommentDTO {
  @IsString({ message: "content is required" })
  content: string;

  @IsNumber({}, { message: "topicId is required" })
  topicId: number;
}

export class UpdateCommentDTO {
  @IsOptional()
  @IsString({ message: "content is required" })
  content?: string;

  @IsOptional()
  @IsNumber({}, { message: "topicId is required" })
  topicId?: number;
}

export class CreateReplyDTO {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber({}, { message: "commentId is required" })
  commentId: number;
}

export class UpdateReplyDTO {
  @IsOptional()
  @IsString({ message: "content is required" })
  content?: string;

  @IsOptional()
  @IsNumber({}, { message: "commentId is required" })
  commentId?: number;
}

export class CreateCommentLikeDTO {
  @IsNumber({}, { message: "commentId is required" })
  commentId: number;
}

export class CreateReplyLikeDTO {
  @IsNumber({}, { message: "replyId is required" })
  replyId: number;
}
