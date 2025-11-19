import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { VehicleController } from "../controllers/vehicle.controller.js";
import { authenticateToken } from "../middleware/auth.js";
const router = Router();
const userController = new UserController();
const vehicleController = new VehicleController();
router.post("/login", userController.login.bind(userController));
router.post("/register", userController.register.bind(userController));
router.post("/become-driver", authenticateToken, vehicleController.registerVehicle.bind(vehicleController));
export default router;
//# sourceMappingURL=auth.route.js.map