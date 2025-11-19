import { PrismaClient } from "../../generated/prisma/index.js";
import NotificationService from "./notification.service.js";
const prisma = new PrismaClient();
const notificationService = new NotificationService();
export class ChatService {
    async ensureConversation(travelId) {
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
    async getConversationParticipants(travelId) {
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
        const participants = [
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
    async assertParticipant(travelId, userId) {
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
    async sendMessage(input) {
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
        // Enviar notificaciones push de forma asíncrona (no bloquear la respuesta)
        setImmediate(async () => {
            try {
                await notificationService.sendChatNotification({
                    travelId: message.conversation.travelId,
                    senderId: message.sender.id,
                    senderName: message.sender.name,
                    messageText: message.body,
                    excludeUserIds: [senderId], // No notificar al remitente
                });
                console.log(`Notificación de chat enviada para mensaje ${message.id} en viaje ${travelId}`);
            }
            catch (notificationError) {
                console.error('Error al enviar notificación de chat:', notificationError);
                // No lanzar error para no afectar el flujo principal
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
    async getMessages(travelId, userId) {
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
//# sourceMappingURL=chat.service.js.map