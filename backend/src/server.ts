import http from 'http';
import { Server, type DefaultEventsMap } from 'socket.io';
import { PrismaClient } from '../generated/prisma/index.js';
import app from './app.js';
import { ChatService } from './services/chat.service.js';
import { verifyToken } from './utils/jwt.js';

const prisma = new PrismaClient();
const chatService = new ChatService();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

type SocketData = {
  user?: {
    id: number;
    email: string;
  };
};

const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      // Allow Expo Go and any local network IP in development
      if (
        origin.includes('expo.dev') ||
        origin.startsWith('exp://') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.0.') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin === 'https://urturn-copy-production.up.railway.app'
      ) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const tokenFromHeader = authHeader?.split(' ')[1];
    const token = socket.handshake.auth?.token || tokenFromHeader;

    if (!token) {
      return next(new Error('Token requerido'));
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        active: true
      },
      select: {
        id: true,
        institutional_email: true
      }
    });

    if (!user) {
      return next(new Error('Usuario no válido'));
    }

    socket.data.user = {
      id: user.id,
      email: user.institutional_email
    };

    return next();
  } catch (error) {
    return next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('chat:join', async (travelId: number, callback?: (response: { ok: boolean; message?: string }) => void) => {
    if (typeof travelId !== 'number' || Number.isNaN(travelId)) {
      callback?.({ ok: false, message: 'travelId inválido' });
      return;
    }

    try {
      const user = socket.data.user;
      if (!user) {
        callback?.({ ok: false, message: 'Usuario no autenticado' });
        return;
      }

      await chatService.assertParticipant(travelId, user.id);
      await chatService.ensureConversation(travelId);

      const roomName = `travel:${travelId}`;
      await socket.join(roomName);
      callback?.({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo unir al chat';
      callback?.({ ok: false, message });
    }
  });

  socket.on('chat:leave', async (travelId: number, callback?: (response: { ok: boolean; message?: string }) => void) => {
    const roomName = `travel:${travelId}`;
    await socket.leave(roomName);
    callback?.({ ok: true });
  });

  socket.on('chat:message', async (payload: { travelId: number; body: string }, callback?: (response: { ok: boolean; message?: string }) => void) => {
    try {
      const user = socket.data.user;
      if (!user) {
        callback?.({ ok: false, message: 'Usuario no autenticado' });
        return;
      }

      if (
        !payload ||
        typeof payload.travelId !== 'number' ||
        Number.isNaN(payload.travelId) ||
        typeof payload.body !== 'string'
      ) {
        callback?.({ ok: false, message: 'Payload inválido' });
        return;
      }

      const message = await chatService.sendMessage({
        travelId: payload.travelId,
        senderId: user.id,
        body: payload.body
      });

      const roomName = `travel:${payload.travelId}`;
      io.to(roomName).emit('chat:message:new', message);
      callback?.({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje';
      callback?.({ ok: false, message });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket desconectado (${socket.id}): ${reason}`);
  });
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`HTTP + Socket.IO escuchando en http://0.0.0.0:${PORT}`);
  console.log(`Disponible en red local: http://192.168.0.101:${PORT}`);
  console.log(`API Base URL: http://192.168.0.101:${PORT}/api`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});
