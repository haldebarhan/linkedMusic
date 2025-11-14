import { ENV } from "@/config/env";
import { MinioService } from "../services/minio.service";
import { container } from "tsyringe";
import { MatchingService } from "@/microservices/matching/matching.service";

const minioService: MinioService = MinioService.getInstance();
const matching = container.resolve(MatchingService);

export const buildThreadRows = async (data: any[], userId: number) => {
  const isSub = await matching.hasActiveSubscription(userId);
  const threadRow = await Promise.all(
    data.map(async (c) => {
      const id = c.id;
      const last = c.messages[0];
      const peer = c.senderId === userId ? c.receiver : c.sender;
      const peerName = isSub ? peer?.displayName : "Utilisateur (masqué)";
      const peerAvatar = isSub
        ? peer.profileImage
          ? await minioService.generatePresignedUrl(
              ENV.MINIO_BUCKET_NAME,
              peer.profileImage
            )
          : ""
        : "https://placehold.co/60x60";
      const count = c._count.messages ?? 0;
      return {
        id,
        peerName,
        peerId: peer.id,
        threadId: id,
        peerAvatar,
        unreadCount: count,
        lastSnippet: isSub ? last.content : "••••••",
        lastAt: last.createdAt,
      };
    })
  );
  return threadRow;
};
