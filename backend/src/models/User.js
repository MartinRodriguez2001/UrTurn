import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

const SALT_ROUNDS = 10;

class User {
  /**
   * Crear un nuevo usuario
   */
  static async create({ email, password, name, role = 'passenger' }) {
    try {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Convertir role a isDriver (booleano)
      const isDriver = role === 'driver';

      const text = `
        INSERT INTO users (email, password, names, isDriver, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, names, isDriver, created_at
      `;
      
      const values = [email.toLowerCase(), hashedPassword, name, isDriver];
      const result = await query(text, values);
      
      // Mapear el resultado al formato esperado por el frontend
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        names: user.names,
        role: user.isdriver ? 'driver' : 'passenger',
        created_at: user.created_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    try {
      const text = 'SELECT id, email, password, names, isDriver, phone_number, descriptions, created_at, updated_at FROM users WHERE email = $1';
      const result = await query(text, [email.toLowerCase()]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      // Mapear el resultado al formato esperado, manteniendo password para verificación
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        password: user.password, // Necesario para verificación de contraseña
        names: user.names,
        role: user.isdriver ? 'driver' : 'passenger',
        phone_number: user.phone_number,
        descriptions: user.descriptions,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const text = 'SELECT id, email, names, isDriver, phone_number, descriptions, created_at, updated_at FROM users WHERE id = $1';
      const result = await query(text, [id]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      // Mapear el resultado al formato esperado
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        names: user.names,
        role: user.isdriver ? 'driver' : 'passenger',
        phone_number: user.phone_number,
        descriptions: user.descriptions,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar contraseña
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar información del usuario
   */
  static async update(id, { name, role }) {
    try {
      // Convertir role a isDriver si se proporciona
      const isDriver = role ? (role === 'driver') : undefined;
      
      const text = `
        UPDATE users 
        SET names = COALESCE($1, names),
            isDriver = COALESCE($2, isDriver),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, email, names, isDriver, updated_at
      `;
      
      const values = [name, isDriver, id];
      const result = await query(text, values);
      
      if (!result.rows[0]) {
        return null;
      }
      
      // Mapear el resultado al formato esperado
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        names: user.names,
        role: user.isdriver ? 'driver' : 'passenger',
        updated_at: user.updated_at
      };
    } catch (error) {
      throw error;
    }
  }
}

export default User;