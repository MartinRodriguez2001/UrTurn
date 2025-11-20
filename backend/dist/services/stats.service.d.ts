export declare class StatsService {
    getUserStats(userId: number): Promise<{
        success: boolean;
        data: {
            asDriver: {
                totalTrips: number;
                completedTrips: number;
                canceledTrips: number;
                pendingTrips: number;
                confirmedTrips: number;
                totalPassengersTransported: number;
                totalEarnings: number;
            };
            asPassenger: {
                totalRequests: number;
                acceptedRequests: number;
                rejectedRequests: number;
                pendingRequests: number;
                completedTrips: number;
                totalSpent: number;
            };
            reviews: {
                averageRating: number | null;
                totalReviewsReceived: number;
                totalReviewsGiven: number;
                ratingDistribution: {
                    5: number;
                    4: number;
                    3: number;
                    2: number;
                    1: number;
                };
            };
            vehicles: {
                totalVehicles: number;
                validatedVehicles: number;
            };
        };
        message: string;
    }>;
    getDriverRanking(limit?: number): Promise<{
        success: boolean;
        drivers: {
            id: number;
            name: string;
            profile_picture: Uint8Array<ArrayBufferLike> | null;
            averageRating: number;
            totalReviews: number;
            totalTrips: number;
            totalPassengers: number;
            score: number;
        }[];
        count: number;
        message: string;
    }>;
    getPlatformStats(): Promise<{
        success: boolean;
        data: {
            users: {
                total: number;
                drivers: number;
                passengers: number;
            };
            travels: {
                total: number;
                completed: number;
                active: number;
                canceled: number;
            };
            vehicles: {
                total: number;
                validated: number;
                pending: number;
            };
            engagement: {
                totalReviews: number;
                totalReports: number;
                averageRating: number | null;
            };
            recentActivity: {
                travelsLast7Days: number;
            };
        };
        message: string;
    }>;
    private getAveragePlatformRating;
}
//# sourceMappingURL=stats.service.d.ts.map