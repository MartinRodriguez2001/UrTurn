-- UrTurn Database Schema
-- PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'driver')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Insertar datos de prueba (opcional)
INSERT INTO users (email, password, name, role) VALUES
('test@example.com', '$2b$10$rQZ5YqHqVqKq5YqHqVqKq.abcdefghijklmnopqrstuvwxyz1234567', 'Usuario Test', 'passenger'),
('driver@example.com', '$2b$10$rQZ5YqHqVqKq5YqHqVqKq.abcdefghijklmnopqrstuvwxyz1234567', 'Conductor Test', 'driver');

-- Mostrar estructura de la tabla
\d users;

-- Mensaje de éxito
SELECT 'Base de datos configurada correctamente!' as message;
