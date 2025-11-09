import { userApi } from '@/Services/UserApiService';
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Review {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
    likes: number;
}

export default function PassengerDriverProfile() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const getParamValue = (value: string | string[] | undefined) =>
        Array.isArray(value) ? value[0] : value;

    const pickupDateValue = getParamValue(params.pickupDate);
    const pickupTimeValue = getParamValue(params.pickupTime);
    const pickupLocation = getParamValue(params.pickupLocation) ?? '';
    const pickupLatitudeParam =
        getParamValue(params.pickupLatitude) ?? getParamValue(params.originLat);
    const pickupLongitudeParam =
        getParamValue(params.pickupLongitude) ?? getParamValue(params.originLng);
    const destinationLatParam = getParamValue(params.destinationLat);
    const destinationLngParam = getParamValue(params.destinationLng);
    const dropoffLocation =
        getParamValue(params.dropoffLocation) ?? getParamValue(params.destination) ?? '';
    const dropoffLatitudeParam =
        getParamValue(params.dropoffLatitude) ?? destinationLatParam;
    const dropoffLongitudeParam =
        getParamValue(params.dropoffLongitude) ?? destinationLngParam;
    const travelIdParam = getParamValue(params.travelId);
    const travelId = travelIdParam ? Number(travelIdParam) : NaN;
    const priceValueParam = getParamValue(params.priceValue);
    const driverPhone = getParamValue(params.driverPhone) ?? '';
    const driverRatingParam = getParamValue(params.driverRating);
    const spacesAvailableParam = getParamValue(params.spacesAvailable);
    const startTimeParam = getParamValue(params.startTime);
    const additionalMinutesParam = getParamValue(params.additionalMinutes);
    const additionalDistanceParam = getParamValue(params.additionalDistanceKm);
    const routeWaypointsParam = getParamValue(params.routeWaypoints);

    const pickupLatitude = pickupLatitudeParam ? Number(pickupLatitudeParam) : NaN;
    const pickupLongitude = pickupLongitudeParam ? Number(pickupLongitudeParam) : NaN;
    const dropoffLatitude = dropoffLatitudeParam ? Number(dropoffLatitudeParam) : NaN;
    const dropoffLongitude = dropoffLongitudeParam ? Number(dropoffLongitudeParam) : NaN;

    const pickupDateDate = useMemo(() => {
        if (!pickupDateValue) {
            return undefined;
        }
        const parsed = new Date(pickupDateValue);
        if (Number.isNaN(parsed.valueOf())) {
            return undefined;
        }
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    }, [pickupDateValue]);

    const pickupTimeDate = useMemo(() => {
        if (!pickupTimeValue) {
            return undefined;
        }
        const parsed = new Date(pickupTimeValue);
        if (Number.isNaN(parsed.valueOf())) {
            return undefined;
        }
        parsed.setSeconds(0, 0);
        if (pickupDateDate) {
            parsed.setFullYear(
                pickupDateDate.getFullYear(),
                pickupDateDate.getMonth(),
                pickupDateDate.getDate()
            );
        }
        return parsed;
    }, [pickupTimeValue, pickupDateDate]);

    const getInitials = (name?: string) => {
        if (!name) return 'P';
        return name
            .split(' ')
            .map((w) => w.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0,2);
    };

    const handleRequestRide = () => {
        if (Number.isNaN(travelId)) {
            Alert.alert('Información incompleta', 'No se pudo determinar el viaje a solicitar.');
            return;
        }

        if (!pickupDateDate || !pickupTimeDate) {
            Alert.alert(
                'Selecciona fecha y hora',
                'Debes elegir una fecha y hora de recogida antes de solicitar.'
            );
            return;
        }

        if (!pickupLocation.trim()) {
            Alert.alert('Selecciona un punto de recogida', 'Debes elegir una ubicación de recogida antes de solicitar.');
            return;
        }

        if (!dropoffLocation.trim()) {
            Alert.alert('Selecciona un destino', 'Debes elegir una ubicación de destino antes de solicitar.');
            return;
        }

        if (!Number.isFinite(pickupLatitude) || Math.abs(pickupLatitude) > 90) {
            Alert.alert('Coordenadas inválidas', 'No se pudieron obtener las coordenadas de recogida. Selecciona una ubicación válida.');
            return;
        }

        if (!Number.isFinite(pickupLongitude) || Math.abs(pickupLongitude) > 180) {
            Alert.alert('Coordenadas inválidas', 'No se pudieron obtener las coordenadas de recogida. Selecciona una ubicación válida.');
            return;
        }

        if (!Number.isFinite(dropoffLatitude) || Math.abs(dropoffLatitude) > 90) {
            Alert.alert('Coordenadas inválidas', 'No se pudieron obtener las coordenadas de destino. Selecciona una ubicación válida.');
            return;
        }

        if (!Number.isFinite(dropoffLongitude) || Math.abs(dropoffLongitude) > 180) {
            Alert.alert('Coordenadas inválidas', 'No se pudieron obtener las coordenadas de destino. Selecciona una ubicación válida.');
            return;
        }

        router.push({
            pathname: "/Passenger/PassengerConfirmation",
            params: {
                travelId: travelId.toString(),
                pickupLocation,
                pickupLatitude: pickupLatitude.toString(),
                pickupLongitude: pickupLongitude.toString(),
                dropoffLocation,
                dropoffLatitude: dropoffLatitude.toString(),
                dropoffLongitude: dropoffLongitude.toString(),
                pickupDate: pickupDateDate.toISOString(),
                pickupTime: pickupTimeDate.toISOString(),
                price,
                priceValue: priceValueParam ?? '',
                driverName,
                driverPhone,
                driverRating: driverRatingParam ?? '',
                spacesAvailable: spacesAvailableParam ?? '',
                startTime: startTimeParam ?? '',
                vehicle: vehicleType,
                additionalMinutes: additionalMinutesParam ?? '',
                additionalDistanceKm: additionalDistanceParam ?? '',
                routeWaypoints: routeWaypointsParam ?? '',
            },
        });
    };
    
    // Get driver info from params or use default
    const driverName = params.name as string || 'Conductor';
    const vehicleType = params.vehicle as string || 'Vehículo';
    const price = params.price as string || '';

    const [driverProfile, setDriverProfile] = useState<any | null>(null);
    const [driverReviews, setDriverReviews] = useState<Review[]>([]);
    const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({5:0,4:0,3:0,2:0,1:0});
    const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
    const [driverTravelsCount, setDriverTravelsCount] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number | null>(driverRatingParam ? Number(driverRatingParam) : null);
    const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            const driverIdParam = getParamValue(params.driverId ?? params.driver) ?? getParamValue(params.driverId ?? params.driverId);
            const id = driverIdParam ? Number(driverIdParam) : NaN;
            if (Number.isNaN(id)) return;
            try {
                setReviewsLoading(true);
                // fetch user profile if available
                const userRes = await userApi.getUserById(id);
                if (userRes?.success && userRes.data) {
                    setDriverProfile(userRes.data);
                }

                                // Prefer to fetch reviews directly from the reviews API for any user.
                                // This endpoint aggregates reviews for the given user and avoids probing travel endpoints.
                                try {
                                    const userReviewsRes = await (await import('@/Services/ReviewApiService')).default.getUserReviews(id).catch(() => null);
                                    const reviewsArr = (userReviewsRes && (userReviewsRes as any).data && (userReviewsRes as any).data.received) || [];
                                    if (Array.isArray(reviewsArr) && reviewsArr.length > 0) {
                                        const gatheredReviews: Review[] = [];
                                        const counts: Record<number, number> = {5:0,4:0,3:0,2:0,1:0};
                                        let total = 0;
                                        let sum = 0;

                                        for (const r of reviewsArr) {
                                            const rating = Number(r.starts ?? r.stars ?? r.rating ?? NaN);
                                            if (!Number.isNaN(rating) && rating >= 1 && rating <= 5) {
                                                counts[Math.round(rating)] = (counts[Math.round(rating)] || 0) + 1;
                                                total++;
                                                sum += Number(rating);
                                            }
                                            gatheredReviews.push({
                                                id: String(r.id ?? Math.random()),
                                                userName: r.reviewer?.name ?? r.user?.name ?? r.author ?? 'Usuario',
                                                userAvatar: r.reviewer?.profile_picture ?? r.user?.profile_picture ?? '👤',
                                                rating: Math.round(rating) || 0,
                                                comment: r.review ?? r.comment ?? r.body ?? '',
                                                date: r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : (r.date ?? ''),
                                                likes: r.likes ?? 0,
                                            });
                                        }

                                        setDriverReviews(gatheredReviews);
                                        setRatingCounts(counts);
                                        setTotalReviewsCount(total);
                                        setAverageRating(total > 0 ? sum / total : (driverRatingParam ? Number(driverRatingParam) : null));
                                    } else {
                                        // fallback: leave existing average and empty reviews
                                        setDriverReviews([]);
                                        setRatingCounts({5:0,4:0,3:0,2:0,1:0});
                                        setTotalReviewsCount(0);
                                    }
                                } catch (e) {
                                    console.error('Failed to load user reviews', e);
                                    setDriverReviews([]);
                                    setRatingCounts({5:0,4:0,3:0,2:0,1:0});
                                    setTotalReviewsCount(0);
                                }
                // We don't have per-user travels here (unless viewing own profile). Driver travels count
                // will remain as 0 if we couldn't fetch them; that's acceptable for external profiles.
                setDriverTravelsCount(0);
            } catch (err) {
                console.error('Error loading driver profile/reviews', err);
            } finally {
                setReviewsLoading(false);
            }
        })();
    }, []);

    // reviews are loaded asynchronously into `driverReviews`

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Text key={index} style={styles.star}>
                {index < rating ? '⭐' : '☆'}
            </Text>
        ));
    };

    const renderReview = (review: Review) => (
        <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewUserInfo}>
                    <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{review.userAvatar}</Text>
                    </View>
                    <View style={styles.reviewUserDetails}>
                        <Text style={styles.reviewUserName}>{review.userName}</Text>
                          <Text style={styles.reviewDate}>{review.date ? String(review.date).slice(0,10) : ''}</Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.reviewStars}>
                {renderStars(review.rating)}
            </View>
            
            <Text style={styles.reviewComment}>{review.comment}</Text>
            
            <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.likeButton}>
                    <Text style={styles.likeIcon}>👍</Text>
                    <Text style={styles.likeCount}>{review.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.replyButton}>
                    <Text style={styles.replyIcon}>💬</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                >
                    <Feather name="arrow-left" size={22} color="#121417" />
                </TouchableOpacity>
                
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Conductor</Text>
                </View>
                
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Driver Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profileImage}>
                            {driverProfile?.profile_picture ? (
                                <Image source={{ uri: driverProfile.profile_picture }} style={styles.profileImagePhoto} />
                            ) : (
                                <Text style={styles.profileInitial}>{getInitials(driverProfile?.name ?? driverName)}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.driverRole}>Conductor</Text>
                        <Text style={styles.driverStats}>{averageRating ? averageRating.toFixed(2) : (driverRatingParam ?? '—')} • {driverTravelsCount} viajes</Text>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acerca de</Text>
                    <Text style={styles.aboutText}>
                        {driverProfile?.description ?? 'Sin descripción disponible.'}
                    </Text>
                </View>

                {/* Vehicle Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vehículo</Text>
                    <View style={styles.vehicleCard}>
                        <View style={styles.vehicleImageContainer}>
                            <Text style={styles.vehicleIcon}>🚗</Text>
                        </View>
                        <View style={styles.vehicleInfo}>
                            <Text style={styles.vehicleType}>Sedán</Text>
                            <Text style={styles.vehicleModel}>{vehicleType}</Text>
                        </View>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reseñas</Text>
                    
                    {/* Rating Overview */}
                    <View style={styles.ratingOverview}>
                        <View style={styles.ratingSummary}>
                            <Text style={styles.ratingNumber}>{averageRating ? averageRating.toFixed(2) : (driverRatingParam ?? '—')}</Text>
                            <View style={styles.ratingStars}>
                                {renderStars(Math.round(averageRating ?? (driverRatingParam ? Number(driverRatingParam) : 0)))}
                            </View>
                            <Text style={styles.ratingCount}>{totalReviewsCount} reviews</Text>
                        </View>
                        
                        <View style={styles.ratingBreakdown}>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>5</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[5] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[5] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>4</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[4] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[4] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>3</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[3] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[3] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>2</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[2] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[2] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>1</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[1] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[1] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Reviews List */}
                    <View style={styles.reviewsList}>
                        {driverReviews.map(renderReview)}
                    </View>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 67,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#121417',
        fontWeight: 'bold',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        textAlign: 'center',
    },
    placeholder: {
        width: 48,
        height: 48,
    },
    scrollContainer: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    profileImageContainer: {
        marginBottom: 16,
    },
    profileImage: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImagePhoto: {
        width: 128,
        height: 128,
        borderRadius: 64,
    },
    profileInitial: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#121417',
    },
    profileInfo: {
        alignItems: 'center',
    },
    driverName: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 22,
        lineHeight: 28,
        color: '#121417',
        textAlign: 'center',
        marginBottom: 4,
    },
    driverRole: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#61758A',
        textAlign: 'center',
        marginBottom: 4,
    },
    driverStats: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#61758A',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        marginBottom: 12,
    },
    aboutText: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    vehicleImageContainer: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    vehicleIcon: {
        fontSize: 32,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleType: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    vehicleModel: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    ratingOverview: {
        flexDirection: 'row',
        marginBottom: 32,
        gap: 32,
    },
    ratingSummary: {
        alignItems: 'center',
        width: 98,
    },
    ratingNumber: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '800',
        fontSize: 36,
        lineHeight: 45,
        color: '#121417',
        marginBottom: 8,
    },
    ratingStars: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 2,
    },
    star: {
        fontSize: 18,
    },
    ratingCount: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
    },
    ratingBreakdown: {
        flex: 1,
        gap: 12,
    },
    ratingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#121417',
        width: 20,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#DBE0E5',
        borderRadius: 4,
    },
    bar: {
        height: '100%',
        backgroundColor: '#121417',
        borderRadius: 4,
    },
    ratingPercentage: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
        width: 40,
        textAlign: 'right',
    },
    reviewsList: {
        gap: 32,
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
    },
    reviewHeader: {
        marginBottom: 12,
    },
    reviewUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAvatarText: {
        fontSize: 20,
    },
    reviewUserDetails: {
        flex: 1,
    },
    reviewUserName: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    reviewDate: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    reviewStars: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 2,
    },
    reviewComment: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 12,
    },
    reviewActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 36,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    likeIcon: {
        fontSize: 20,
    },
    likeCount: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 24,
        color: '#61758A',
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyIcon: {
        fontSize: 20,
    },
    bottomSpacer: {
        height: 100,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    requestButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F99F7C',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    requestButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    messageButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    messageButtonText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
    },
    bottomNavigation: {
        flexDirection: 'row',
        height: 75,
        backgroundColor: '#FFFFFF',
        paddingTop: 9,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        gap: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navIcon: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navIconActive: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#61758A',
        textAlign: 'center',
    },
    navLabelActive: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#121417',
        textAlign: 'center',
    },
});
