import { Server } from "socket.io";
import { AuthenticatedSocket } from "@/utils/interfaces/authenticated-socket";
import { ChatService } from "@/utils/services/chat.service";
import { MessageService } from "@/utils/services/message.service";

export const registerChatHandlers = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const chatService = new ChatService();
  const messageService = new MessageService();

  socket.on("send_message", async (data) => {
    const { receiverId, content, announcementId } = data;
    const senderId = socket.data.user.id;

    let conversation = await chatService.getOrCreateConversation(
      senderId,
      receiverId,
      announcementId
    );
    const message = await messageService.createMessage({
      senderId,
      conversationId: conversation.id,
      content,
    });

    const targetSocket = [...io.sockets.sockets.values()].find(
      (s) => s.data?.user?.id === receiverId
    );

    if (targetSocket) {
      targetSocket.emit("new_message", {
        conversationId: conversation.id,
        senderId,
        content,
        createdAt: message.createdAt,
      });
    }
  });

  socket.on("get_conversations", async (_, callback) => {
    const conversations = await chatService.getUserConversations(
      socket.data.user.id
    );
    callback(conversations);
  });

  socket.on("get_messages", async (conversationId, callback) => {
    const messages = await messageService.getMessagesByConversationId(
      conversationId
    );
    callback(messages);
  });
};
