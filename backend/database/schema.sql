-- UrTurn Database Schema
-- PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwords VARCHAR(255) NOT NULL,
    names VARCHAR(100) NOT NULL,
    isDriver BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    descriptions TEXT,
    -- Archivo de la credencial institucional
    -- Foto de perfil
    -- Certificado estudiantil
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE travel_request (
    id SERIAL PRIMARY KEY,
    passenger_id INT REFERENCES users(id) ON DELETE CASCADE,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    locations VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE travel ( 
    id SERIAL PRIMARY KEY,
    driver_id INT REFERENCES users(id) ON DELETE CASCADE,
    car_id INT REFERENCES vehicle(id) ON DELETE SET NULL,
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    spaces_available INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'finalized')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    years INT,
    validations BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE confirmation (
    id SERIAL PRIMARY KEY,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    confirmation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rating (
    id SERIAL PRIMARY KEY,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    reviewer_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_target_id INT REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score IN (1, 2, 3, 4, 5)),
    review TEXT, -- Comentario opcional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE travel_message (
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES travel_request(id) ON DELETE CASCADE,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);

CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    -- Pantallazo del comprobante de pago
);

CREATE TABLE report_incident (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    travel_id INT REFERENCES travel(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Insertar datos de prueba (opcional)
INSERT INTO users (email, passwords, names, isDriver, phone_number, descriptions) VALUES
('test@example.com', '$2b$10$rQZ5YqHqVqKq5YqHqVqKq.abcdefghijklmnopqrstuvwxyz1234567', 'Usuario Test', FALSE, '+598 99 123 456', 'Estudiante de Ingeniería'),
('driver@example.com', '$2b$10$rQZ5YqHqVqKq5YqHqVqKq.abcdefghijklmnopqrstuvwxyz1234567', 'Conductor Test', TRUE, '+598 99 654 321', 'Conductor experimentado con vehículo propio');

-- Mostrar estructura de la tabla
\d users;

-- Mensaje de éxito
SELECT 'Base de datos configurada correctamente!' as message;
