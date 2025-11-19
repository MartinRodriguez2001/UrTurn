export interface ReviewData {
    reviewer_id: number;
    user_target_id: number;
    travel_id: number;
    starts: number;
    review?: string;
}
export declare class ReviewService {
    createReview(reviewData: ReviewData): Promise<{
        success: boolean;
        review: {
            travel: {
                start_location: string | null;
                end_location: string | null;
                id: number;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
            } | null;
            reviewer: {
                id: number;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            user_target: {
                id: number;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            date: Date;
            review: string;
            reviewer_id: number;
            user_target_id: number;
            travel_id: number;
            starts: number;
        };
        message: string;
    }>;
    getUserReviews(userId: number): Promise<{
        success: boolean;
        data: {
            received: ({
                travel: {
                    id: number;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    start_time: Date;
                };
                reviewer: {
                    id: number;
                    name: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                };
            } & {
                id: number;
                date: Date;
                review: string;
                reviewer_id: number;
                user_target_id: number;
                travel_id: number;
                starts: number;
            })[];
            given: ({
                travel: {
                    id: number;
                    start_location_name: string | null;
                    start_latitude: number;
                    start_longitude: number;
                    end_location_name: string | null;
                    end_latitude: number;
                    end_longitude: number;
                    start_time: Date;
                };
                user_target: {
                    id: number;
                    name: string;
                    profile_picture: Uint8Array<ArrayBufferLike> | null;
                };
            } & {
                id: number;
                date: Date;
                review: string;
                reviewer_id: number;
                user_target_id: number;
                travel_id: number;
                starts: number;
            })[];
            stats: {
                averageRating: number | null;
                totalReceived: number;
                totalGiven: number;
                ratingDistribution: {
                    5: number;
                    4: number;
                    3: number;
                    2: number;
                    1: number;
                };
            };
        };
        message: string;
    }>;
    getTravelReviews(travelId: number): Promise<{
        success: boolean;
        reviews: {
            travel: {
                start_location: string | null;
                end_location: string | null;
                id: number;
                start_location_name: string | null;
                start_latitude: number;
                start_longitude: number;
                end_location_name: string | null;
                end_latitude: number;
                end_longitude: number;
                start_time: Date;
            } | null;
            reviewer: {
                id: number;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            user_target: {
                id: number;
                name: string;
                profile_picture: Uint8Array<ArrayBufferLike> | null;
            };
            id: number;
            date: Date;
            review: string;
            reviewer_id: number;
            user_target_id: number;
            travel_id: number;
            starts: number;
        }[];
        count: number;
        message: string;
    }>;
    deleteReview(reviewId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=review.service.d.ts.map