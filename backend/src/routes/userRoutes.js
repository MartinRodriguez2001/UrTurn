import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserVehicles,
  getUserTripsAsDriver,
  getUserTripsAsPassenger
} from '../controllers/userController.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Rutas relacionadas con usuarios
router.get('/:id/vehicles', getUserVehicles);
router.get('/:id/trips/driver', getUserTripsAsDriver);
router.get('/:id/trips/passenger', getUserTripsAsPassenger);

export default router;
