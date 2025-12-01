import { ENV } from "@/config/env";
import { container } from "tsyringe";
import { MatchingService } from "@/microservices/matching/matching.service";
import { S3Service } from "../services/s3.service";

const minioService: S3Service = S3Service.getInstance();
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
              ENV.AWS_S3_DEFAULT_BUCKET,
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
        peerBadge: peer.badge,
      };
    })
  );
  return threadRow;
};
