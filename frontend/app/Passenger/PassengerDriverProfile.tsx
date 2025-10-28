import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Alert,
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
    const driverName = params.name as string || 'Victor Lazcano';
    const vehicleType = params.vehicle as string || 'Porsche';
    const price = params.price as string || '300 CLP';

    const reviews: Review[] = [
        {
            id: '1',
            userName: 'Sofía',
            userAvatar: '👩',
            rating: 5,
            comment: 'Victor fue muy amable y el viaje fue muy cómodo. Definitivamente volvería a viajar con él.',
            date: 'Hace 2 semanas',
            likes: 2
        },
        {
            id: '2',
            userName: 'Mateo',
            userAvatar: '👨',
            rating: 1,
            comment: 'Terrible, me tuvo esperando 1 hora, llegue tarde a mi prueba.',
            date: 'Hace 1 mes',
            likes: 1
        },
        {
            id: '3',
            userName: 'Isabella',
            userAvatar: '👩',
            rating: 4,
            comment: 'Victor es un gran conductor y muy amable. El viaje fue muy agradable y llegué a tiempo.',
            date: 'Hace 2 meses',
            likes: 3
        }
    ];

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
                        <Text style={styles.reviewDate}>{review.date}</Text>
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
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>â†</Text>
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
                            <Text style={styles.profileInitial}>V</Text>
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.driverRole}>Conductor</Text>
                        <Text style={styles.driverStats}>4.8 • 120 viajes</Text>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acerca de</Text>
                    <Text style={styles.aboutText}>
                        Soy estudiante de ingenieria. Me gusta conocer gente nueva y hacer que sus viajes sean seguros y agradables.
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
                            <Text style={styles.ratingNumber}>4.8</Text>
                            <View style={styles.ratingStars}>
                                {renderStars(5)}
                            </View>
                            <Text style={styles.ratingCount}>120 reviews</Text>
                        </View>
                        
                        <View style={styles.ratingBreakdown}>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>5</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: '75%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>75%</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>4</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: '15%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>15%</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>3</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: '5%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>5%</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>2</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: '3%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>3%</Text>
                            </View>
                            <View style={styles.ratingBar}>
                                <Text style={styles.ratingLabel}>1</Text>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: '2%' }]} />
                                </View>
                                <Text style={styles.ratingPercentage}>2%</Text>
                            </View>
                        </View>
                    </View>

                    {/* Reviews List */}
                    <View style={styles.reviewsList}>
                        {reviews.map(renderReview)}
                    </View>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={handleRequestRide}
                >
                    <Text style={styles.requestButtonText}>
                        Revisar detalles
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Mensaje</Text>
                </TouchableOpacity>
            </View>
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
