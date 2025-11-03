import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export type ParticipantRole = "driver" | "passenger";

export interface ConversationParticipant {
  userId: number;
  role: ParticipantRole;
}

export interface ChatMessagePayload {
  id: number;
  converasationId: number;
  travelId: number;
  body: string;
  sentAt: Date;
  sender: {
    id: number;
    name: string;
    profile_picture: string | null;
  };
}

export interface SendMessageInput {
  travelId: number;
  senderId: number;
  body: string;
}

export class ChatService {
  async ensureConversation(travelId: number) {
    return prisma.travelConversation.upsert({
      where: { travelId },
      update: {},
      create: {
        travel: {
          connect: { id: travelId }
        }
      },
      include: {
        travel: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });
  }

  async getConversationParticipants(travelId: number): Promise<ConversationParticipant[]> {
    const travel = await prisma.travel.findUnique({
      where: { id: travelId },
      select: {
        id: true,
        userId: true,
        confirmations: {
          select: {
            usuarioId: true
          }
        }
      }
    });

    if (!travel) {
      throw new Error("Viaje no encontrado");
    }

    const participants: ConversationParticipant[] = [
      { userId: travel.userId, role: "driver" }
    ];

    for (const confirmation of travel.confirmations) {
      participants.push({
        userId: confirmation.usuarioId,
        role: "passenger"
      });
    }

    return participants;
  }

  async assertParticipant(travelId: number, userId: number): Promise<ParticipantRole> {
    const travel = await prisma.travel.findUnique({
      where: { id: travelId },
      select: {
        id: true,
        userId: true
      }
    });

    if (!travel) {
      throw new Error("Viaje no encontrado");
    }

    if (travel.userId === userId) {
      return "driver";
    }

    const confirmation = await prisma.confirmation.findFirst({
      where: {
        travelId,
        usuarioId: userId
      },
      select: { id: true }
    });

    if (!confirmation) {
      throw new Error("El usuario no está autorizado para este chat");
    }

    return "passenger";
  }

  async sendMessage(input: SendMessageInput): Promise<ChatMessagePayload> {
    const { travelId, senderId, body } = input;

    if (!body || body.trim().length === 0) {
      throw new Error("El mensaje no puede estar vacío");
    }

    await this.assertParticipant(travelId, senderId);
    const conversation = await this.ensureConversation(travelId);

    const message = await prisma.travelMessage.create({
      data: {
        body: body.trim(),
        sender: {
          connect: { id: senderId }
        },
        conversation: {
          connect: { id: conversation.id }
        }
      },
      include: {
        conversation: {
          select: {
            id: true,
            travelId: true
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            profile_picture: true
          }
        }
      }
    });

    return {
      id: message.id,
      converasationId: message.converasationId,
      travelId: message.conversation.travelId,
      body: message.body,
      sentAt: message.sentAt,
      sender: message.sender
    };
  }

  async getMessages(travelId: number, userId: number): Promise<ChatMessagePayload[]> {
    await this.assertParticipant(travelId, userId);
    await this.ensureConversation(travelId);

    const messages = await prisma.travelMessage.findMany({
      where: {
        conversation: {
          travelId
        }
      },
      orderBy: {
        sentAt: "asc"
      },
      include: {
        conversation: {
          select: {
            id: true,
            travelId: true
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            profile_picture: true
          }
        }
      }
    });

    return messages.map((message) => ({
      id: message.id,
      converasationId: message.converasationId,
      travelId: message.conversation.travelId,
      body: message.body,
      sentAt: message.sentAt,
      sender: message.sender
    }));
  }
}
