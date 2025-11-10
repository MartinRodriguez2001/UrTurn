import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { ReviewData, ReviewService } from "../services/review.service.js";

const reviewService = new ReviewService();

export class ReviewController {
  async createReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const { user_target_id, travel_id, starts, review } = req.body;

      // `review` (comentario) puede ser una cadena vacía; no la hacemos requerida estrictamente.
      if (
        user_target_id === undefined ||
        user_target_id === null ||
        travel_id === undefined ||
        travel_id === null ||
        starts === undefined ||
        starts === null
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos: user_target_id, travel_id, starts",
        });
      }

      const reviewData: ReviewData = {
        reviewer_id: userId,
        user_target_id: parseInt(user_target_id),
        travel_id: parseInt(travel_id),
        starts: parseInt(starts),
        review: review ?? '',
      };

      const result = await reviewService.createReview(reviewData);
      res.status(201).json(result);

    } catch (error) {
      console.error("Error in createReview:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al crear review",
      });
    }
  }

  async getUserReviews(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId || "");

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario inválido",
        });
      }

      const result = await reviewService.getUserReviews(userId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getUserReviews:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener reviews del usuario",
      });
    }
  }

  async getMyReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await reviewService.getUserReviews(userId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getMyReviews:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener tus reviews",
      });
    }
  }

  async getTravelReviews(req: Request, res: Response) {
    try {
      const travelId = parseInt(req.params.travelId || "");

      if (isNaN(travelId)) {
        return res.status(400).json({
          success: false,
          message: "ID de viaje inválido",
        });
      }

      const result = await reviewService.getTravelReviews(travelId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in getTravelReviews:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener reviews del viaje",
      });
    }
  }

  async deleteReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const reviewId = parseInt(req.params.id || "");

      if (isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "ID de review inválido",
        });
      }

      const result = await reviewService.deleteReview(reviewId, userId);
      res.status(200).json(result);

    } catch (error) {
      console.error("Error in deleteReview:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Error al eliminar review",
      });
    }
  }
}
