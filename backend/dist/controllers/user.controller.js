import { UserService } from '../services/auth.service.js';
const userService = new UserService();
export class UserController {
    async register(req, res) {
        try {
            const result = await userService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: result
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error en el registro'
            });
        }
    }
    async login(req, res) {
        try {
            const result = await userService.login(req.body);
            res.json({
                success: true,
                message: 'Login exitoso',
                data: result
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error en el login'
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            const users = await userService.getAllUsers();
            // Map profile_picture to an accessible URL when binary data is present
            const mapped = users.map((u) => ({
                ...u,
                profile_picture: u.profile_picture ? `${req.protocol}://${req.get('host')}/api/users/${u.id}/photo` : null
            }));
            res.json({
                success: true,
                data: mapped
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios'
            });
        }
    }
    async getUserById(req, res) {
        try {
            const id = parseInt(req.params.id || '');
            const user = await userService.getUserById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
                return;
            }
            const mapped = {
                ...user,
                profile_picture: user.profile_picture ? `${req.protocol}://${req.get('host')}/api/users/${user.id}/photo` : null
            };
            res.json({
                success: true,
                data: mapped
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario'
            });
        }
    }
    async updateUser(req, res) {
        try {
            const id = parseInt(req.params.id || '');
            const user = await userService.updateUser(id, req.body);
            const mapped = {
                ...user,
                profile_picture: user.profile_picture ? `${req.protocol}://${req.get('host')}/api/users/${user.id}/photo` : null
            };
            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: mapped
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error al actualizar usuario'
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const id = parseInt(req.params.id || '');
            await userService.deleteUser(id);
            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
    }
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const profile = await userService.getProfile(userId);
            const mapped = {
                ...profile,
                profile_picture: profile?.profile_picture ? `${req.protocol}://${req.get('host')}/api/users/${profile.id}/photo` : null
            };
            res.json({
                success: true,
                data: mapped
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil'
            });
        }
    }
    // Servir la imagen de perfil (binary) por id de usuario
    async serveProfilePhoto(req, res) {
        try {
            const id = parseInt(req.params.id || '');
            const user = await userService.getUserById(id);
            if (!user || !user.profile_picture) {
                res.status(404).json({ success: false, message: 'Imagen no encontrada' });
                return;
            }
            const mime = user.profile_picture_mime || 'image/jpeg';
            res.setHeader('Content-Type', mime);
            // profile_picture is expected to be Buffer/Uint8Array
            res.send(user.profile_picture);
            return;
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Error al servir imagen de perfil' });
        }
    }
}
//# sourceMappingURL=user.controller.js.map