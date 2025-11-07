import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './authContext';
import { getSocket, disconnectSocket, type ChatSocket } from '@/Services/SocketService';
import travelApiService from '@/Services/TravelApiService';
import type { ChatMessage } from '@/types/chat';

type MessagesByTravel = Record<number, ChatMessage[]>;

interface ChatContextValue {
  messages: MessagesByTravel;
  loading: boolean;
  error?: string | null;
  joinChat: (travelId: number) => Promise<void>;
  leaveChat: (travelId: number) => Promise<void>;
  sendMessage: (travelId: number, body: string) => Promise<void>;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const normaliseMessage = (message: ChatMessage): ChatMessage => {
  const sentAt =
    typeof message.sentAt === 'string'
      ? message.sentAt
      : new Date(message.sentAt).toISOString();

  return {
    ...message,
    sentAt,
  };
};

const sortMessages = (messages: ChatMessage[]) =>
  [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const socketRef = useRef<ChatSocket | null>(null);
  const listenersRegisteredRef = useRef(false);
  const [messages, setMessages] = useState<MessagesByTravel>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joinedTravels, setJoinedTravels] = useState<Set<number>>(new Set());

  const updateMessages = useCallback((travelId: number, nextMessages: ChatMessage[] | ChatMessage) => {
    setMessages((prev) => {
      const previousForTravel = prev[travelId] ?? [];
      const merged = Array.isArray(nextMessages)
        ? nextMessages
        : [...previousForTravel, nextMessages];

      return {
        ...prev,
        [travelId]: sortMessages(merged.map(normaliseMessage)),
      };
    });
  }, []);

  const handleIncomingMessage = useCallback(
    (message: ChatMessage) => {
      if (!message || typeof message.travelId !== 'number') {
        return;
      }
      updateMessages(message.travelId, normaliseMessage(message));
    },
    [updateMessages]
  );

  const registerSocketListeners = useCallback(
    (socket: ChatSocket) => {
      if (listenersRegisteredRef.current) {
        return;
      }

      socket.on('chat:message:new', handleIncomingMessage);
      socket.on('disconnect', () => {
        setIsConnected(false);
      });
      socket.on('connect', () => {
        setIsConnected(true);
      });
      socket.on('connect_error', (socketError: Error) => {
        setError(socketError.message);
      });

      listenersRegisteredRef.current = true;
    },
    [handleIncomingMessage]
  );

  const ensureSocket = useCallback(async (): Promise<ChatSocket> => {
    if (!isAuthenticated) {
      throw new Error('Usuario no autenticado');
    }

    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }

    try {
      const socket = await getSocket();
      socketRef.current = socket;
      registerSocketListeners(socket);
      setIsConnected(socket.connected);
      return socket;
    } catch (socketError) {
      const message =
        socketError instanceof Error ? socketError.message : 'No se pudo conectar al chat';
      setError(message);
      throw socketError;
    }
  }, [isAuthenticated, registerSocketListeners]);

  const joinChat = useCallback(
    async (travelId: number) => {
      const parsedId = Number(travelId);
      if (!Number.isFinite(parsedId)) {
        throw new Error('ID de viaje inválido');
      }

      setLoading(true);
      setError(null);

      try {
        const socket = await ensureSocket();

        await new Promise<void>((resolve, reject) => {
          socket.emit('chat:join', parsedId, (response?: { ok: boolean; message?: string }) => {
            if (response?.ok) {
              resolve();
            } else {
              reject(new Error(response?.message ?? 'No se pudo entrar al chat'));
            }
          });
        });

        setJoinedTravels((prev) => {
          if (prev.has(parsedId)) {
            return prev;
          }
          const next = new Set(prev);
          next.add(parsedId);
          return next;
        });

        const response = await travelApiService.getTravelMessages(parsedId);
        if (response.success) {
          updateMessages(parsedId, response.messages ?? []);
        } else {
          throw new Error(response.message ?? 'No se pudieron obtener los mensajes');
        }
      } catch (joinError) {
        const message =
          joinError instanceof Error ? joinError.message : 'No se pudo entrar al chat';
        setError(message);
        throw joinError;
      } finally {
        setLoading(false);
      }
    },
    [ensureSocket, updateMessages]
  );

  const leaveChat = useCallback(
    async (travelId: number) => {
      const parsedId = Number(travelId);
      if (!Number.isFinite(parsedId)) {
        return;
      }

      if (!joinedTravels.has(parsedId)) {
        return;
      }

      try {
        const socket = await ensureSocket();
        await new Promise<void>((resolve) => {
          socket.emit('chat:leave', parsedId, () => resolve());
        });
      } catch (leaveError) {
        const message =
          leaveError instanceof Error ? leaveError.message : 'Error al salir del chat';
        setError(message);
      } finally {
        setJoinedTravels((prev) => {
          if (!prev.has(parsedId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(parsedId);
          return next;
        });
      }
    },
    [ensureSocket, joinedTravels]
  );

  const sendMessage = useCallback(
    async (travelId: number, body: string) => {
      if (!body.trim()) {
        return;
      }

      const parsedId = Number(travelId);
      if (!Number.isFinite(parsedId)) {
        throw new Error('ID de viaje inválido');
      }

      try {
        const socket = await ensureSocket();
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            'chat:message',
            { travelId: parsedId, body },
            (response?: { ok: boolean; message?: string }) => {
              if (response?.ok) {
                resolve();
              } else {
                reject(new Error(response?.message ?? 'No se pudo enviar el mensaje'));
              }
            }
          );
        });
      } catch (socketError) {
        console.warn('Fallo al enviar por socket, intentando fallback REST', socketError);
        const response = await travelApiService.sendTravelMessage(parsedId, body);
        if (response.success) {
          updateMessages(parsedId, response.data);
          return;
        }
        throw new Error(response.message ?? 'No se pudo enviar el mensaje');
      }
    },
    [ensureSocket, updateMessages]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      socketRef.current = null;
      listenersRegisteredRef.current = false;
      setMessages({});
      setJoinedTravels(new Set());
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      loading,
      error,
      joinChat,
      leaveChat,
      sendMessage,
      isConnected,
    }),
    [messages, loading, error, joinChat, leaveChat, sendMessage, isConnected]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe usarse dentro de un ChatProvider');
  }
  return context;
};
