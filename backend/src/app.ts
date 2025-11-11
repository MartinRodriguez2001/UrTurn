import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { PrismaClient } from '../generated/prisma/index.js';
import authRoutes from "./routes/auth.route.js";
import notificationRoutes from "./routes/notification.route.js";
import reportRoutes from "./routes/report.route.js";
import reviewRoutes from "./routes/review.route.js";
import statsRoutes from "./routes/stats.route.js";
import travelRoutes from "./routes/travel.route.js";
import userRoutes from "./routes/user.route.js";
import vehicleRoutes from "./routes/vehicle.route.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(helmet());

// Configure CORS origins
const allowedOrigins = [
  // Localhost variants
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:19006',
  // Network IPs for mobile devices (192.168.0.x and 192.168.1.x)
  'http://192.168.0.101:8081',
  'http://192.168.0.101:8082',
  'http://192.168.0.101:3000',
  'http://192.168.1.18:8081',
  'http://192.168.1.18:8082',
  'http://192.168.1.18:3000',
  // Expo mobile apps
  'exp://192.168.0.101:8081',
  'exp://192.168.0.101:8082',
  'exp://192.168.1.18:8081',
  'exp://192.168.1.18:8082',
  // Production URL (Railway)
  'https://urturn-copy-production.up.railway.app'
];

// Add custom frontend URL from env if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow Expo Go domains dynamically
    if (origin.includes('expo.dev') || origin.startsWith('exp://')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any local network IP in development
    if (process.env.NODE_ENV === 'development' &&
        (origin.startsWith('http://192.168.') || origin.startsWith('http://10.0.'))) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'UrTurn Backend API is running!' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/travels', travelRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

export default app;
