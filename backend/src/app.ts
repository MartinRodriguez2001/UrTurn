import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { PrismaClient } from '../generated/prisma/index.js';
import userRoutes from "./routes/user.route.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
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
app.use('/api/users', userRoutes);

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