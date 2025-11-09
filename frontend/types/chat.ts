export interface ChatMessage {
  id: number;
  converasationId: number;
  travelId: number;
  body: string;
  sentAt: string;
  sender: {
    id: number;
    name: string;
    profile_picture: string | null;
  };
}

export interface ChatMessagesPayload {
  messages: ChatMessage[];
}

export interface ChatSendPayload {
  data: ChatMessage;
}
