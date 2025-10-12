# 🚗 UrTurn - Aplicación de Viajes Compartidos

Aplicación móvil para compartir viajes entre pasajeros y conductores.

## 🚀 Stack Tecnológico

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express.js
- **Base de datos**: PostgreSQL
- **Containerización**: Docker + Docker Compose

## 📋 Requisitos Previos

- **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux)
- **Node.js 16+**
- **Git**

## ⚙️ Inicio Rápido con Docker

### 1. Clonar e instalar

```bash
git clone <url-del-repo>
cd UrTurn
```

### 2. Iniciar servicios (PostgreSQL + Backend)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Verificar que estén corriendo
docker-compose ps
```

**Servicios disponibles:**
- 🗄️ PostgreSQL: `localhost:5432`
- 🔧 Backend API: `http://localhost:3000`

### 3. Probar que funciona

```bash
# Verificar API
curl http://localhost:3000

# Debería responder:
# {"success":true,"message":"UrTurn API funcionando correctamente"}
```

### 4. Instalar frontend (React Native)

```bash
npm install
npx expo start
```

## 🗄️ Base de Datos

### Credenciales por defecto (Docker)

```
Host: localhost
Port: 5432
Database: urturn_db
User: urturn
Password: urturn123
```

### Acceder a PostgreSQL

```bash
# Desde Docker
docker exec -it urturn_postgres psql -U urturn -d urturn_db

# Comandos útiles:
\dt              # Ver tablas
\d users         # Ver estructura de tabla users
SELECT * FROM users;  # Ver usuarios
\q               # Salir
```

### Resetear base de datos

```bash
docker-compose down -v    # Eliminar datos
docker-compose up -d      # Recrear (ejecuta schema.sql automáticamente)
```

## 🧪 API Endpoints

### Registro de usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Usuario Test",
    "role": "passenger"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Obtener perfil (requiere token)
```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

## 📱 Desarrollo Frontend (React Native)

```bash
# Instalar dependencias
npm install

# Iniciar Expo
npx expo start

# Opciones:
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Escanea QR con Expo Go app
```

## 🛠️ Comandos de Docker

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Reconstruir contenedores (si cambias Dockerfile)
docker-compose up -d --build

# Reiniciar un servicio
docker-compose restart backend

# Limpiar todo (¡cuidado! elimina datos)
docker-compose down -v
docker system prune -a
```

## 📁 Estructura del Proyecto

```
UrTurn/
├── app/                      # Frontend React Native
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── register.tsx
│   └── Driver/
│
├── backend/                  # Backend Node.js
│   ├── src/
│   │   ├── config/          # Configuración DB
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Autenticación, validación
│   │   ├── models/          # Modelos (User, etc)
│   │   ├── routes/          # Rutas API
│   │   └── server.js        # Entrada principal
│   ├── database/
│   │   └── schema.sql       # Schema PostgreSQL
│   ├── Dockerfile
│   ├── .env                 # Variables de entorno
│   └── package.json
│
├── docker-compose.yml        # Configuración Docker
└── README.md
```

## 👥 Trabajo en Equipo

### Para nuevos desarrolladores:

1. **Clonar el repositorio**
   ```bash
   git clone <url>
   cd UrTurn
   ```

2. **Iniciar servicios**
   ```bash
   docker-compose up -d
   ```

3. **Instalar frontend**
   ```bash
   npm install
   ```

4. **¡Listo!** Todos usan la misma configuración.

### Compartir cambios en la BD

```bash
# Hacer cambios en backend/database/schema.sql
git add backend/database/schema.sql
git commit -m "Agregar tabla de viajes"
git push

# Otros desarrolladores:
git pull
docker-compose down -v    # Resetear BD
docker-compose up -d      # Recrear con nuevo schema
```

## 🐛 Solución de Problemas

### Puerto 5432 ya está en uso

```bash
# Opción 1: Detener PostgreSQL local
sudo service postgresql stop

# Opción 2: Cambiar puerto en docker-compose.yml
# ports: "5433:5432"
```

### Backend no conecta a PostgreSQL

```bash
# Ver logs
docker-compose logs backend

# Verificar que postgres esté healthy
docker-compose ps
```

### Cambios en el código no se reflejan

```bash
# Reconstruir contenedor
docker-compose up -d --build backend
```

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT
- ✅ Validación de inputs
- ✅ Variables de entorno (`.env` no se sube a Git)

## 📚 Documentación Adicional

- [Backend API](./backend/README.md)
- [Expo Documentation](https://docs.expo.dev/)
- [Docker Compose](https://docs.docker.com/compose/)

## 📝 Próximas Funcionalidades

- [ ] CRUD de viajes
- [ ] Sistema de búsqueda
- [ ] Sistema de reservas
- [ ] Calificaciones
- [ ] Notificaciones en tiempo real
- [ ] Geolocalización

## 👤 Autores

UrTurn Team
