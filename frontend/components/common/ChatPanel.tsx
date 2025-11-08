import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useChat } from '@/context/chatContext';
import type { ChatMessage } from '@/types/chat';

interface ChatPanelProps {
  travelId?: number;
  title?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ travelId, title = 'Chat del viaje' }) => {
  const { joinChat, leaveChat, sendMessage, messages, loading, error } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const chatMessages = useMemo<ChatMessage[]>(() => {
    if (travelId === undefined) {
      return [];
    }
    return messages[travelId] ?? [];
  }, [messages, travelId]);

  useEffect(() => {
    if (travelId === undefined) {
      return;
    }

    let isMounted = true;
    setJoining(true);
    setLocalError(null);

    joinChat(travelId)
      .catch((joinError) => {
        if (!isMounted) return;
        const message =
          joinError instanceof Error ? joinError.message : 'No se pudo abrir el chat';
        setLocalError(message);
      })
      .finally(() => {
        if (isMounted) {
          setJoining(false);
        }
      });

    return () => {
      isMounted = false;
      leaveChat(travelId).catch(() => undefined);
    };
  }, [joinChat, leaveChat, travelId]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || travelId === undefined) {
      return;
    }

    const text = inputValue.trim();
    setInputValue('');
    setLocalError(null);

    try {
      await sendMessage(travelId, text);
      Keyboard.dismiss();
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'No se pudo enviar el mensaje';
      setLocalError(message);
      setInputValue(text);
    }
  }, [inputValue, sendMessage, travelId]);

  if (travelId === undefined) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {(joining || loading) && <ActivityIndicator size="small" color="#2563EB" />}
      </View>

      {error || localError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{localError ?? error}</Text>
        </View>
      ) : null}

      <FlatList
        data={chatMessages}
        keyExtractor={(item) => String(item.id)}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sentAt = new Date(item.sentAt);
          const timeLabel = Number.isNaN(sentAt.getTime())
            ? ''
            : sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <View style={styles.messageBubble}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{item.sender.name}</Text>
                <Text style={styles.messageTime}>{timeLabel}</Text>
              </View>
              <Text style={styles.messageBody}>{item.body}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          !(joining || loading) ? (
            <Text style={styles.emptyState}>
              Aún no hay mensajes. ¡Sé el primero en escribir!
            </Text>
          ) : null
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#94A3B8"
          onChangeText={setInputValue}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!inputValue.trim()}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  messageList: {
    maxHeight: 220,
  },
  messageListContent: {
    paddingBottom: 8,
  },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 12,
    color: '#64748B',
  },
  messageBody: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 18,
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    color: '#0F172A',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ChatPanel;
