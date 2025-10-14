import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTrips
} from '../controllers/vehicleController.js';

const router = express.Router();

// Rutas de vehículos
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

// Rutas relacionadas con vehículos
router.get('/:id/trips', getVehicleTrips);

export default router;
