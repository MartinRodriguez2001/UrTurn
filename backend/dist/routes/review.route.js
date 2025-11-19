import { Router } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { authenticateToken } from "../middleware/auth.js";
const router = Router();
const reviewController = new ReviewController();
// POST /api/reviews - Crear nuevo review
router.post("/", authenticateToken, reviewController.createReview.bind(reviewController));
// GET /api/reviews/me - Obtener mis reviews (dados y recibidos)
router.get("/me", authenticateToken, reviewController.getMyReviews.bind(reviewController));
// GET /api/reviews/user/:userId - Obtener reviews de un usuario específico
router.get("/user/:userId", authenticateToken, reviewController.getUserReviews.bind(reviewController));
// GET /api/reviews/travel/:travelId - Obtener reviews de un viaje
router.get("/travel/:travelId", authenticateToken, reviewController.getTravelReviews.bind(reviewController));
// DELETE /api/reviews/:id - Eliminar un review propio
router.delete("/:id", authenticateToken, reviewController.deleteReview.bind(reviewController));
export default router;
//# sourceMappingURL=review.route.js.map