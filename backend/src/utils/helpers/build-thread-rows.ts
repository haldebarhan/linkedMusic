import { ENV } from "@/config/env";
import { MinioService } from "../services/minio.service";

const minioService: MinioService = MinioService.getInstance();

export const buildThreadRows = async (data: any[], userId: number) => {
  const threadRow = await Promise.all(
    data.map(async (c) => {
      const id = c.id;
      const last = c.Messages[0];
      const peer = c.senderId === userId ? c.receiver : c.sender;
      const peerName = peer?.Profile?.displayName ?? `User ${peer?.id}`;
      const peerAvatar = peer.profileImage
        ? await minioService.generatePresignedUrl(
            ENV.MINIO_BUCKET_NAME,
            peer.profileImage
          )
        : "";
      const count = c._count.Messages ?? 0;

      return {
        id,
        peerName,
        peerId: peer.id,
        threadId: id,
        peerAvatar,
        unreadCount: count,
        lastSnippet: last.content,
        lastAt: last.createdAt,
      };
    })
  );
  return threadRow;
};
