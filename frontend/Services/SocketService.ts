import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_BASE_URL } from './BaseApiService';

const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

const getSocketUrl = () => {
  // When running on device, localhost should point to the same host configured for HTTP.
  if (__DEV__ && Platform.OS === 'android' && SOCKET_BASE_URL.includes('10.0.2.2')) {
    return SOCKET_BASE_URL;
  }
  return SOCKET_BASE_URL;
};

const createSocketConnection = async (): Promise<Socket> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Token no disponible');
  }

  const instance = io(getSocketUrl(), {
    transports: ['websocket', 'polling'], // Allow both websocket and polling
    auth: {
      token
    },
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
    upgrade: true, // Allow upgrading from polling to websocket
    rememberUpgrade: true
  });

  return new Promise<Socket>((resolve, reject) => {
    const handleConnect = () => {
      console.log('✅ Socket.IO conectado exitosamente');
      instance.off('connect_error', handleError);
      resolve(instance);
    };

    const handleError = (error: Error) => {
      console.error('❌ Error conectando Socket.IO:', error.message);
      instance.off('connect', handleConnect);
      reject(error);
    };

    instance.once('connect', handleConnect);
    instance.once('connect_error', handleError);

    // Log connection attempts
    console.log('🔄 Intentando conectar Socket.IO a:', getSocketUrl());
  });
};

export const getSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }

  if (!connectPromise) {
    connectPromise = createSocketConnection()
      .then((instance) => {
        socket = instance;
        connectPromise = null;
        return instance;
      })
      .catch((error) => {
        connectPromise = null;
        socket = null;
        throw error;
      });
  }

  return connectPromise;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const socketManager = {
  getSocket,
  disconnect: disconnectSocket
};

export type ChatSocket = Socket;
