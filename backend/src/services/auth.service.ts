import { PrismaClient } from '../../generated/prisma/index.js';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/Auth.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from "../utils/password.js";

const prisma = new PrismaClient();

export class UserService {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { institutional_email: userData.institutional_email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(userData.password);

    // Extraer password y crear objeto sin ese campo
    const { password, ...userDataWithoutPassword } = userData;

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        password_hash: hashedPassword,
        active: true
      },
      select: {
        id: true,
        name: true,
        institutional_email: true,
        IsDriver: true,
        active: true,
      }
    });

    // Generar token
    const token = generateToken({
      userId: user.id,
      email: user.institutional_email
    });

    return { user, token };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { institutional_email: credentials.institutional_email }
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }
    const isValidPassword = await comparePassword(credentials.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.active) {
      throw new Error('Usuario desactivado');
    }
    const token = generateToken({
      userId: user.id,
      email: user.institutional_email
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        institutional_email: user.institutional_email,
        IsDriver: user.IsDriver,
        active: user.active,
      },
      token
    };
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        institutional_email: true,
        IsDriver: true,
        active: true,
        phone_number: true,
        profile_picture: true,
        description: true,
        created_at: true,
      }
    });
  }

  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        institutional_email: true,
        IsDriver: true,
        active: true,
        phone_number: true,
        profile_picture: true,
        description: true,
        created_at: true,
        updated_at: true,
      }
    });
  }

  async updateUser(id: number, data: Partial<RegisterRequest>) {
    // Extraer password si existe y crear objeto sin ese campo
    const { password, ...updateDataWithoutPassword } = data;
    
    const updateData: any = { ...updateDataWithoutPassword };
    
    // Si se incluye una nueva contraseña, hashearla
    if (password) {
      updateData.password_hash = await hashPassword(password);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        institutional_email: true,
        IsDriver: true,
        active: true,
        phone_number: true,
        profile_picture: true,
        description: true,
        updated_at: true,
      }
    });
  }

  async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id }
    });
  }

  async getProfile(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        institutional_email: true,
        IsDriver: true,
        active: true,
        phone_number: true,
        profile_picture: true,
        description: true,
        created_at: true,
        updated_at: true,
      }
    });
  }
}