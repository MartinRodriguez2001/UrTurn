import { query } from '../config/database.js';

// Obtener todas las calificaciones
export const getAllRatings = async (req, res) => {
  try {
    const { user_target_id, travel_id } = req.query;

    let queryText = `
      SELECT r.*,
             reviewer.names as reviewer_name,
             target.names as target_name,
             t.start_location, t.end_location
      FROM rating r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN users target ON r.user_target_id = target.id
      JOIN travel t ON r.travel_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (user_target_id) {
      params.push(user_target_id);
      queryText += ` AND r.user_target_id = $${params.length}`;
    }

    if (travel_id) {
      params.push(travel_id);
      queryText += ` AND r.travel_id = $${params.length}`;
    }

    queryText += ' ORDER BY r.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificaciones',
      error: error.message
    });
  }
};

// Obtener calificación por ID
export const getRatingById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT r.*,
              reviewer.names as reviewer_name, reviewer.email as reviewer_email,
              target.names as target_name, target.email as target_email,
              t.start_location, t.end_location, t.start_time
       FROM rating r
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       JOIN users target ON r.user_target_id = target.id
       JOIN travel t ON r.travel_id = t.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calificación',
      error: error.message
    });
  }
};

// Crear una nueva calificación
export const createRating = async (req, res) => {
  try {
    const { travel_id, reviewer_id, user_target_id, score, review } = req.body;

    // Validar que el score esté entre 1 y 5
    if (![1, 2, 3, 4, 5].includes(score)) {
      return res.status(400).json({
        success: false,
        message: 'El puntaje debe ser entre 1 y 5'
      });
    }

    // Verificar que el viaje exista y esté completado
    const travelCheck = await query(
      'SELECT id, status FROM travel WHERE id = $1',
      [travel_id]
    );

    if (travelCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    if (travelCheck.rows[0].status !== 'completed' && travelCheck.rows[0].status !== 'finalized') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes calificar viajes completados'
      });
    }

    // Verificar que el revisor y el usuario objetivo existan
    const usersCheck = await query(
      'SELECT id FROM users WHERE id IN ($1, $2)',
      [reviewer_id, user_target_id]
    );

    if (usersCheck.rows.length !== 2) {
      return res.status(404).json({
        success: false,
        message: 'Usuario(s) no encontrado(s)'
      });
    }

    // Verificar que no se califique a sí mismo
    if (reviewer_id === user_target_id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes calificarte a ti mismo'
      });
    }

    // Verificar que no exista ya una calificación del mismo usuario en el mismo viaje
    const existingRating = await query(
      'SELECT id FROM rating WHERE travel_id = $1 AND reviewer_id = $2 AND user_target_id = $3',
      [travel_id, reviewer_id, user_target_id]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya has calificado a este usuario en este viaje'
      });
    }

    const result = await query(
      `INSERT INTO rating (travel_id, reviewer_id, user_target_id, score, review)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [travel_id, reviewer_id, user_target_id, score, review || null]
    );

    res.status(201).json({
      success: true,
      message: 'Calificación creada correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear calificación',
      error: error.message
    });
  }
};

// Actualizar calificación
export const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, review } = req.body;

    // Validar que el score esté entre 1 y 5
    if (score && ![1, 2, 3, 4, 5].includes(score)) {
      return res.status(400).json({
        success: false,
        message: 'El puntaje debe ser entre 1 y 5'
      });
    }

    const result = await query(
      'UPDATE rating SET score = $1, review = $2 WHERE id = $3 RETURNING *',
      [score, review || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Calificación actualizada correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar calificación',
      error: error.message
    });
  }
};

// Eliminar calificación
export const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM rating WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Calificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar calificación',
      error: error.message
    });
  }
};

// Obtener promedio de calificaciones de un usuario
export const getUserRatingAverage = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT
         COUNT(*) as total_ratings,
         AVG(score) as average_score,
         COUNT(CASE WHEN score = 5 THEN 1 END) as five_stars,
         COUNT(CASE WHEN score = 4 THEN 1 END) as four_stars,
         COUNT(CASE WHEN score = 3 THEN 1 END) as three_stars,
         COUNT(CASE WHEN score = 2 THEN 1 END) as two_stars,
         COUNT(CASE WHEN score = 1 THEN 1 END) as one_star
       FROM rating
       WHERE user_target_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user_id: userId,
        total_ratings: parseInt(result.rows[0].total_ratings),
        average_score: parseFloat(result.rows[0].average_score) || 0,
        distribution: {
          five_stars: parseInt(result.rows[0].five_stars),
          four_stars: parseInt(result.rows[0].four_stars),
          three_stars: parseInt(result.rows[0].three_stars),
          two_stars: parseInt(result.rows[0].two_stars),
          one_star: parseInt(result.rows[0].one_star)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener promedio de calificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promedio',
      error: error.message
    });
  }
};
