## Configuración de la Base de Datos

### Requisitos previos
- PostgreSQL instalado
- Node.js 18+

### Configuración inicial

1. **Instalar PostgreSQL:**
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. **Crear usuario y base de datos:**
   ```bash
   psql postgres
   ```
   ```sql
   CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
   CREATE DATABASE mydb OWNER myuser;
   GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
   ALTER USER myuser CREATEDB;
   \q
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de base de datos.

4. **Aplicar esquema:**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

5. **Ejecutar el servidor:**
   ```bash
   npm run dev
   ```

### Comandos útiles
- `npx prisma studio` - Abrir interfaz gráfica de la DB
- `npx prisma db push` - Aplicar cambios del schema
- `npx prisma generate` - Regenerar el cliente


### Alternativa con docker

 ```bash
   docker-compose up -d
   npx prisma db push
   ```