# UrTurn Backend API

Backend de la aplicación UrTurn construido con Express.js y PostgreSQL.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **bcrypt** - Hash de contraseñas

## 📋 Requisitos previos

- Node.js >= 16.x
- PostgreSQL >= 14.x
- npm o yarn

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus credenciales:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urturn_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_jwt
```

### 3. Configurar la base de datos

**Opción A: Desde psql**

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE urturn_db;

# Conectar a la base de datos
\c urturn_db

# Ejecutar el schema
\i database/schema.sql
```

**Opción B: Desde terminal**

```bash
createdb -U postgres urturn_db
psql -U postgres -d urturn_db -f database/schema.sql
```

### 4. Iniciar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## 📚 Endpoints de la API

### Autenticación

#### Registrar usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "role": "passenger"  // "passenger" o "driver"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "passenger",
      "createdAt": "2024-10-11T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "passenger"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Obtener perfil (requiere autenticación)
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "passenger",
      "createdAt": "2024-10-11T10:30:00.000Z"
    }
  }
}
```

## 🧪 Probar la API

### Con curl

**Registro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "passenger"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Con Postman o Thunder Client

1. Importa la colección o crea requests manualmente
2. Usa los endpoints mostrados arriba
3. Para rutas protegidas, agrega el header:
   - Key: `Authorization`
   - Value: `Bearer {tu_token}`

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuración de PostgreSQL
│   ├── controllers/
│   │   └── authController.js # Lógica de autenticación
│   ├── middleware/
│   │   ├── authMiddleware.js    # Verificación de JWT
│   │   └── validateRequest.js   # Validaciones
│   ├── models/
│   │   └── User.js           # Modelo de usuario
│   ├── routes/
│   │   └── authRoutes.js     # Rutas de autenticación
│   └── server.js             # Punto de entrada
├── database/
│   └── schema.sql            # Schema de la base de datos
├── .env                      # Variables de entorno
├── .env.example              # Ejemplo de variables
├── package.json
└── README.md
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Autenticación JWT
- Validación de inputs con express-validator
- Variables de entorno para credenciales
- CORS configurado

## 🐛 Solución de problemas

### Error: "no se pudo conectar a PostgreSQL"
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en `.env`
- Asegúrate de que la base de datos exista

### Error: "relation users does not exist"
- Ejecuta el script `database/schema.sql`

### Error: "Puerto ya en uso"
- Cambia el `PORT` en `.env`
- O cierra el proceso que esté usando el puerto 3000

## 📝 Próximos pasos

- [ ] Implementar rutas de viajes (CRUD)
- [ ] Sistema de búsqueda de viajes
- [ ] Sistema de reservas
- [ ] Notificaciones en tiempo real
- [ ] Sistema de calificaciones
- [ ] Tests unitarios e integración

## 👤 Autor

UrTurn Team
