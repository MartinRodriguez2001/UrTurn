import express from 'express';
import {
  getAllRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
  getUserRatingAverage
} from '../controllers/ratingController.js';

const router = express.Router();

// Rutas de calificaciones
router.get('/', getAllRatings);
router.get('/:id', getRatingById);
router.post('/', createRating);
router.put('/:id', updateRating);
router.delete('/:id', deleteRating);

// Rutas relacionadas con calificaciones
router.get('/user/:userId/average', getUserRatingAverage);

export default router;
