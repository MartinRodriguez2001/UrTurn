import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Configuración del pool de conexiones a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urturn_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Evento cuando se conecta
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

// Evento de error
pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

// Función helper para ejecutar queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Test de conexión exitoso:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error en test de conexión:', error.message);
    return false;
  }
};

export default pool;
