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
        profile_picture: Uint8Array | string | null;
    };
}
export interface SendMessageInput {
    travelId: number;
    senderId: number;
    body: string;
}
export declare class ChatService {
    ensureConversation(travelId: number): Promise<{
        travel: {
            id: number;
            userId: number;
        };
    } & {
        id: number;
        created_at: Date;
        travelId: number;
    }>;
    getConversationParticipants(travelId: number): Promise<ConversationParticipant[]>;
    assertParticipant(travelId: number, userId: number): Promise<ParticipantRole>;
    sendMessage(input: SendMessageInput): Promise<ChatMessagePayload>;
    getMessages(travelId: number, userId: number): Promise<ChatMessagePayload[]>;
}
//# sourceMappingURL=chat.service.d.ts.map