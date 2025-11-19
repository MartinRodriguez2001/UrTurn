import { PrismaClient } from "../../generated/prisma/index.js";
const prisma = new PrismaClient();
export class ReviewService {
    async createReview(reviewData) {
        try {
            // Validar que el viaje existe y está finalizado
            const travel = await prisma.travel.findUnique({
                where: { id: reviewData.travel_id },
                include: {
                    confirmations: true,
                    driver_id: true,
                },
            });
            if (!travel) {
                throw new Error("El viaje no existe");
            }
            if (travel.status !== "finalizado") {
                throw new Error("Solo se pueden calificar viajes finalizados");
            }
            // Verificar que el reviewer participó en el viaje
            const isDriver = travel.userId === reviewData.reviewer_id;
            const isPassenger = travel.confirmations.some((c) => c.usuarioId === reviewData.reviewer_id);
            if (!isDriver && !isPassenger) {
                throw new Error("Solo los participantes del viaje pueden dejar reviews");
            }
            // Verificar que el target participó en el viaje
            const targetIsDriver = travel.userId === reviewData.user_target_id;
            const targetIsPassenger = travel.confirmations.some((c) => c.usuarioId === reviewData.user_target_id);
            if (!targetIsDriver && !targetIsPassenger) {
                throw new Error("Solo puedes calificar a participantes del viaje");
            }
            // No puedes calificarte a ti mismo
            if (reviewData.reviewer_id === reviewData.user_target_id) {
                throw new Error("No puedes calificarte a ti mismo");
            }
            // Verificar que no haya calificado antes
            const existingReview = await prisma.review.findFirst({
                where: {
                    reviewer_id: reviewData.reviewer_id,
                    user_target_id: reviewData.user_target_id,
                    travel_id: reviewData.travel_id,
                },
            });
            if (existingReview) {
                throw new Error("Ya has calificado a este usuario en este viaje");
            }
            // Validar estrellas
            if (reviewData.starts < 1 || reviewData.starts > 5) {
                throw new Error("La calificación debe estar entre 1 y 5 estrellas");
            }
            const review = await prisma.review.create({
                data: {
                    reviewer_id: reviewData.reviewer_id,
                    user_target_id: reviewData.user_target_id,
                    travel_id: reviewData.travel_id,
                    starts: reviewData.starts,
                    // Si review es undefined o null, crear como cadena vacía
                    review: (reviewData.review ?? '').trim(),
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    user_target: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    travel: {
                        select: {
                            id: true,
                            start_location_name: true,
                            start_latitude: true,
                            start_longitude: true,
                            end_location_name: true,
                            end_latitude: true,
                            end_longitude: true,
                            start_time: true,
                        },
                    },
                },
            });
            return {
                success: true,
                review: review
                    ? {
                        ...review,
                        travel: review.travel
                            ? {
                                ...review.travel,
                                start_location: review.travel.start_location_name,
                                end_location: review.travel.end_location_name,
                            }
                            : null,
                    }
                    : review,
                message: "Review creado exitosamente",
            };
        }
        catch (error) {
            console.error("Error creating review:", error);
            throw new Error(error instanceof Error ? error.message : "Error al crear review");
        }
    }
    async getUserReviews(userId) {
        try {
            const reviewsReceived = await prisma.review.findMany({
                where: {
                    user_target_id: userId,
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    travel: {
                        select: {
                            id: true,
                            start_location_name: true,
                            start_latitude: true,
                            start_longitude: true,
                            end_location_name: true,
                            end_latitude: true,
                            end_longitude: true,
                            start_time: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            });
            const reviewsGiven = await prisma.review.findMany({
                where: {
                    reviewer_id: userId,
                },
                include: {
                    user_target: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    travel: {
                        select: {
                            id: true,
                            start_location_name: true,
                            start_latitude: true,
                            start_longitude: true,
                            end_location_name: true,
                            end_latitude: true,
                            end_longitude: true,
                            start_time: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            });
            const withLegacyLocations = (reviews) => reviews.map((item) => ({
                ...item,
                travel: item.travel
                    ? {
                        ...item.travel,
                        start_location: item.travel.start_location_name,
                        end_location: item.travel.end_location_name,
                    }
                    : null,
            }));
            const normalizedReceived = withLegacyLocations(reviewsReceived);
            const normalizedGiven = withLegacyLocations(reviewsGiven);
            const averageRating = normalizedReceived.length > 0
                ? normalizedReceived.reduce((sum, r) => sum + r.starts, 0) /
                    normalizedReceived.length
                : null;
            return {
                success: true,
                data: {
                    received: normalizedReceived,
                    given: normalizedGiven,
                    stats: {
                        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
                        totalReceived: normalizedReceived.length,
                        totalGiven: normalizedGiven.length,
                        ratingDistribution: {
                            5: normalizedReceived.filter((r) => r.starts === 5).length,
                            4: normalizedReceived.filter((r) => r.starts === 4).length,
                            3: normalizedReceived.filter((r) => r.starts === 3).length,
                            2: normalizedReceived.filter((r) => r.starts === 2).length,
                            1: normalizedReceived.filter((r) => r.starts === 1).length,
                        },
                    },
                },
                message: "Reviews obtenidos exitosamente",
            };
        }
        catch (error) {
            console.error("Error getting user reviews:", error);
            throw new Error("Error al obtener reviews del usuario");
        }
    }
    async getTravelReviews(travelId) {
        try {
            const reviews = await prisma.review.findMany({
                where: { travel_id: travelId },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    user_target: {
                        select: {
                            id: true,
                            name: true,
                            profile_picture: true,
                        },
                    },
                    travel: {
                        select: {
                            id: true,
                            start_location_name: true,
                            start_latitude: true,
                            start_longitude: true,
                            end_location_name: true,
                            end_latitude: true,
                            end_longitude: true,
                            start_time: true,
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            });
            const enrichedReviews = reviews.map((review) => ({
                ...review,
                travel: review.travel
                    ? {
                        ...review.travel,
                        start_location: review.travel.start_location_name,
                        end_location: review.travel.end_location_name,
                    }
                    : null,
            }));
            return {
                success: true,
                reviews: enrichedReviews,
                count: enrichedReviews.length,
                message: "Reviews del viaje obtenidos exitosamente",
            };
        }
        catch (error) {
            console.error("Error getting travel reviews:", error);
            throw new Error("Error al obtener reviews del viaje");
        }
    }
    async deleteReview(reviewId, userId) {
        try {
            const review = await prisma.review.findUnique({
                where: { id: reviewId },
            });
            if (!review) {
                throw new Error("Review no encontrado");
            }
            if (review.reviewer_id !== userId) {
                throw new Error("No tienes autorización para eliminar este review");
            }
            await prisma.review.delete({
                where: { id: reviewId },
            });
            return {
                success: true,
                message: "Review eliminado exitosamente",
            };
        }
        catch (error) {
            console.error("Error deleting review:", error);
            throw new Error(error instanceof Error ? error.message : "Error al eliminar review");
        }
    }
}
//# sourceMappingURL=review.service.js.map