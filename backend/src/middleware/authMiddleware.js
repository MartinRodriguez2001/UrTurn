import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar JWT token
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      // Agregar usuario a la request
      req.user = user;
      next();
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
};

/**
 * Middleware para verificar roles
 */
export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción'
      });
    }

    next();
  };
};
