import express from 'express';
import {
  getAllTravels,
  getTravelById,
  createTravel,
  updateTravel,
  updateTravelStatus,
  deleteTravel,
  getTravelRequests,
  getTravelPassengers
} from '../controllers/travelController.js';

const router = express.Router();

// Rutas de viajes
router.get('/', getAllTravels);
router.get('/:id', getTravelById);
router.post('/', createTravel);
router.put('/:id', updateTravel);
router.patch('/:id/status', updateTravelStatus);
router.delete('/:id', deleteTravel);

// Rutas relacionadas con viajes
router.get('/:id/requests', getTravelRequests);
router.get('/:id/passengers', getTravelPassengers);

export default router;
