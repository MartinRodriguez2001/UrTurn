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

      const text = `
        INSERT INTO users (email, password, name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, name, role, created_at
      `;
      
      const values = [email.toLowerCase(), hashedPassword, name, role];
      const result = await query(text, values);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  static async findByEmail(email) {
    try {
      const text = 'SELECT * FROM users WHERE email = $1';
      const result = await query(text, [email.toLowerCase()]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findById(id) {
    try {
      const text = 'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1';
      const result = await query(text, [id]);
      
      return result.rows[0] || null;
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
      const text = `
        UPDATE users 
        SET name = COALESCE($1, name),
            role = COALESCE($2, role),
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, email, name, role, updated_at
      `;
      
      const values = [name, role, id];
      const result = await query(text, values);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default User;
