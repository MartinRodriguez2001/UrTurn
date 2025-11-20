import { PrismaClient } from '../../generated/prisma/index.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from "../utils/password.js";
const prisma = new PrismaClient();
export class UserService {
    async register(userData) {
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
        const { password, profile_picture, ...userDataWithoutPassword } = userData;
        // Prepare create data and convert profile_picture (data URL / base64) to Buffer when provided
        const createData = { ...userDataWithoutPassword };
        createData.password_hash = hashedPassword;
        createData.active = true;
        if (typeof profile_picture === 'string' && profile_picture.length > 0) {
            const dataUrlMatch = profile_picture.match(/^data:(.+);base64,(.*)$/);
            if (dataUrlMatch && dataUrlMatch[2]) {
                const mime = dataUrlMatch[1];
                const b64 = dataUrlMatch[2];
                createData.profile_picture = Buffer.from(b64, 'base64');
                createData.profile_picture_mime = mime;
            }
            else {
                try {
                    createData.profile_picture = Buffer.from(profile_picture, 'base64');
                    createData.profile_picture_mime = 'image/jpeg';
                }
                catch (e) {
                    // ignore invalid base64
                }
            }
        }
        // Crear el usuario
        const user = await prisma.user.create({
            data: createData,
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
    async login(credentials) {
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
    async getUserById(id) {
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
    async updateUser(id, data) {
        const { password, profile_picture, ...updateDataWithoutPassword } = data;
        const updateData = { ...updateDataWithoutPassword };
        if (password) {
            updateData.password_hash = await hashPassword(password);
        }
        // If profile_picture is provided as a data URL or base64 string, convert to Buffer and store as Bytes
        if (typeof profile_picture === 'string' && profile_picture.length > 0) {
            // Detect data URL like: data:<mime>;base64,<data>
            const dataUrlMatch = profile_picture.match(/^data:(.+);base64,(.*)$/);
            if (dataUrlMatch && dataUrlMatch[2]) {
                const mime = dataUrlMatch[1];
                const b64 = dataUrlMatch[2];
                updateData.profile_picture = Buffer.from(b64, 'base64');
                updateData.profile_picture_mime = mime;
            }
            else {
                // If raw base64 is provided, assume jpeg
                try {
                    updateData.profile_picture = Buffer.from(profile_picture, 'base64');
                    updateData.profile_picture_mime = 'image/jpeg';
                }
                catch (e) {
                    // ignore invalid base64
                }
            }
        }
        // select typing may be out of sync while schema changed; cast to any to avoid strict client type errors
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
                profile_picture_mime: true,
                description: true,
                updated_at: true,
            }
        });
    }
    async deleteUser(id) {
        return prisma.user.delete({
            where: { id }
        });
    }
    async getProfile(userId) {
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
//# sourceMappingURL=auth.service.js.map