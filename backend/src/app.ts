import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { PrismaClient } from '../generated/prisma/index.js';
import authRoutes from "./routes/auth.route.js";
import reportRoutes from "./routes/report.route.js";
import reviewRoutes from "./routes/review.route.js";
import statsRoutes from "./routes/stats.route.js";
import travelRoutes from "./routes/travel.route.js";
import userRoutes from "./routes/user.route.js";
import vehicleRoutes from "./routes/vehicle.route.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',  
    'http://localhost:8081',  // Expo Dev Tools
    'http://localhost:8082',  // Frontend React Native
    'http://localhost:19006', // Expo Web
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://127.0.0.1:19006'
  ],
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
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/travels", travelRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stats", statsRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ██╗   ██╗██████╗ ████████╗██╗   ██╗██████╗ ███╗   ██╗     ║
║  ██║   ██║██╔══██╗╚══██╔══╝██║   ██║██╔══██╗████╗  ██║     ║
║  ██║   ██║██████╔╝   ██║   ██║   ██║██████╔╝██╔██╗ ██║     ║
║  ██║   ██║██╔══██╗   ██║   ██║   ██║██╔══██╗██║╚██╗██║     ║
║  ╚██████╔╝██║  ██║   ██║   ╚██████╔╝██║  ██║██║ ╚████║     ║
║   ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝     ║
║                                                              ║
║                Ride Sharing Platform API                ║
║                                                              ║
║  Server: http://localhost:${PORT}                               ║
║  Status: ✅ Running                                          ║
║  Database: ✅ Connected                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default app;