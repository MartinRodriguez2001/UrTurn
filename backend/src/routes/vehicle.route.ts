import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const vehicleController = new VehicleController();

// POST /api/vehicles - Registrar vehículo
router.post(
  "/", 
  authenticateToken, 
  vehicleController.registerVehicle.bind(vehicleController)
);

// GET /api/vehicles - Obtener vehículos del usuario
router.get(
  "/", 
  authenticateToken, 
  vehicleController.getUserVehicles.bind(vehicleController)
);

// GET /api/vehicles/check - Verificar si tiene vehículos
router.get(
  "/check", 
  authenticateToken, 
  vehicleController.checkUserHasVehicles.bind(vehicleController)
);

// GET /api/vehicles/:id - Obtener vehículo específico
router.get(
  "/:id", 
  authenticateToken, 
  vehicleController.getVehicleById.bind(vehicleController)
);

// PUT /api/vehicles/:id - Actualizar vehículo
router.put(
  "/:id", 
  authenticateToken, 
  vehicleController.updateVehicle.bind(vehicleController)
);

// DELETE /api/vehicles/:id - Eliminar vehículo
router.delete(
  "/:id", 
  authenticateToken, 
  vehicleController.deleteVehicle.bind(vehicleController)
);

export default router;