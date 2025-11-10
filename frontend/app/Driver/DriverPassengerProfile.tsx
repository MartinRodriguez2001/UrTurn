import reviewApiService from '@/Services/ReviewApiService';
import travelApiService from '@/Services/TravelApiService';
import { userApi } from '@/Services/UserApiService';
import StarRating from '@/components/common/StarRating';
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DriverPassengerProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const getParamValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const passengerIdParam = getParamValue(params.passengerId ?? params.id ?? params.userId);
  const passengerId = passengerIdParam ? Number(passengerIdParam) : NaN;

  const [passengerProfile, setPassengerProfile] = useState<any | null>(null);
  const [passengerReviews, setPassengerReviews] = useState<any[]>([]);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({5:0,4:0,3:0,2:0,1:0});
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  // Modal / review state for driver to review this passenger
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (Number.isNaN(passengerId)) return;
      try {
        const res = await userApi.getUserById(passengerId);
        if (res?.success && res.data) {
          setPassengerProfile(res.data);
        }
      } catch (e) {
        console.error('Error fetching passenger profile', e);
      }
    })();
  }, [passengerId]);

  useEffect(() => {
    (async () => {
      if (Number.isNaN(passengerId)) return;
      setReviewsLoading(true);
      try {
        // Only try to fetch passenger travels if the requested passenger is the authenticated user.
        // Backend supports `/travels/passenger` for the authenticated passenger; it doesn't
        // provide a generic `/travels?usuarioId=...` route. Avoid probing unknown endpoints.
        let travels: any[] = [];
        try {
          const profileRes = await userApi.getProfile().catch(() => null);
          const currentUserId = profileRes?.success && profileRes.data ? profileRes.data.id : undefined;
          if (currentUserId !== undefined && Number(currentUserId) === Number(passengerId)) {
            const travelsRes = await travelApiService.getPassengerTravels().catch(() => null);
            travels = (travelsRes && (travelsRes as any).data && (travelsRes as any).data.requested) || (travelsRes && (travelsRes as any).data && (travelsRes as any).data.confirmed) || (travelsRes && (travelsRes as any).travels) || [];
          } else {
            travels = [];
          }
        } catch (e) {
          travels = [];
        }

        const gatheredReviews: any[] = [];
        const counts: Record<number, number> = {5:0,4:0,3:0,2:0,1:0};
        let total = 0;
        let sum = 0;

        for (const t of travels) {
          // try multiple possible keys for reviews
          const reviewsArr = t?.reviews || t?.travel?.reviews || t?.driver_reviews || t?.passenger_reviews || [];
          if (Array.isArray(reviewsArr)) {
            for (const r of reviewsArr) {
              const rating = Number(r.rating ?? r.stars ?? r.starts ?? r.value ?? NaN);
              if (!Number.isNaN(rating) && rating >=1 && rating <=5) {
                counts[Math.round(rating)] = (counts[Math.round(rating)] || 0) + 1;
                total++;
                sum += Number(rating);
              }
              gatheredReviews.push({
                id: String(r.id ?? Math.random()),
                userName: r.user?.name ?? r.userName ?? r.author ?? 'Conductor',
                userAvatar: r.user?.profile_picture ?? r.userAvatar ?? '👤',
                rating: Math.round(rating) || 0,
                comment: r.comment ?? r.body ?? r.text ?? '',
                date: r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : (r.date ?? ''),
                likes: r.likes ?? 0,
              });
            }
          }

          // also use passenger_rating fields if drivers rated passenger numerically
          if (t?.passenger_rating !== undefined && t?.passenger_rating !== null) {
            const pr = Number(t.passenger_rating);
            if (!Number.isNaN(pr) && pr >=1 && pr <=5) {
              counts[Math.round(pr)] = (counts[Math.round(pr)] || 0) + 1;
              total++;
              sum += pr;
            }
          }
        }

        // If we didn't gather any reviews from travels (e.g. viewing another passenger),
        // try to fetch their reviews directly from the reviews API.
        if (gatheredReviews.length > 0) {
          setPassengerReviews(gatheredReviews);
          setRatingCounts(counts);
          setTotalReviewsCount(total);
          setAverageRating(total > 0 ? sum / total : null);
        } else {
          try {
            const userReviewsRes = await (await import('@/Services/ReviewApiService')).default.getUserReviews(passengerId).catch(() => null);
            const reviewsArr = (userReviewsRes && (userReviewsRes as any).data && (userReviewsRes as any).data.received) || [];
            if (Array.isArray(reviewsArr) && reviewsArr.length > 0) {
              const counts2: Record<number, number> = {5:0,4:0,3:0,2:0,1:0};
              let total2 = 0;
              let sum2 = 0;
              const gathered2: any[] = [];
              for (const r of reviewsArr) {
                const rating = Number(r.starts ?? r.stars ?? r.rating ?? NaN);
                if (!Number.isNaN(rating) && rating >=1 && rating <=5) {
                  counts2[Math.round(rating)] = (counts2[Math.round(rating)] || 0) + 1;
                  total2++;
                  sum2 += Number(rating);
                }
                gathered2.push({
                  id: String(r.id ?? Math.random()),
                  userName: r.reviewer?.name ?? r.user?.name ?? 'Conductor',
                  userAvatar: r.reviewer?.profile_picture ?? r.user?.profile_picture ?? '👤',
                  rating: Math.round(rating) || 0,
                  comment: r.review ?? r.comment ?? r.body ?? '',
                  date: r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : (r.date ?? ''),
                  likes: r.likes ?? 0,
                });
              }
              setPassengerReviews(gathered2);
              setRatingCounts(counts2);
              setTotalReviewsCount(total2);
              setAverageRating(total2 > 0 ? sum2 / total2 : null);
            } else {
              setPassengerReviews([]);
              setRatingCounts({5:0,4:0,3:0,2:0,1:0});
              setTotalReviewsCount(0);
              setAverageRating(null);
            }
          } catch (e) {
            console.error('Error fetching user reviews fallback', e);
            setPassengerReviews([]);
            setRatingCounts({5:0,4:0,3:0,2:0,1:0});
            setTotalReviewsCount(0);
            setAverageRating(null);
          }
        }
      } catch (e) {
        console.error('Error fetching passenger travels/reviews', e);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [passengerId]);

  const getInitials = (name?: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = useMemo(() => {
    return getParamValue(params.name) ?? passengerProfile?.name ?? 'Pasajero';
  }, [params.name, passengerProfile]);

  const passengerIdValue = useMemo(() => {
    const raw = getParamValue(params.passengerId ?? params.id ?? params.userId);
    return raw ? Number(raw) : NaN;
  }, [params.passengerId, params.id, params.userId]);

  const handleOpenReviewModal = () => {
    if (Number.isNaN(passengerIdValue)) return;
    setReviewRating(5);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (Number.isNaN(passengerIdValue)) return;
    try {
      setSubmittingReview(true);
      // Ensure current user is not the same as the target
      try {
        const profileRes = await userApi.getProfile().catch(() => null);
        const currentUserId = profileRes?.success && profileRes.data ? profileRes.data.id : undefined;
        if (currentUserId !== undefined && Number(currentUserId) === Number(passengerIdValue)) {
          throw new Error('No puedes calificarte a ti mismo');
        }
      } catch (err) {
        // If we couldn't determine current user id, continue and let backend validate.
      }
      // Try to find a travel id where this passenger was confirmed in the driver's travels
      let travelIdToUse: number | null = null;
      try {
        const driverTravelsRes = await travelApiService.getDriverTravels();
        if (driverTravelsRes.success && driverTravelsRes.travels) {
          const found = (driverTravelsRes.travels as any[]).find((t) =>
            Array.isArray(t.passengers?.confirmed) && t.passengers.confirmed.some((p: any) => Number(p.id) === Number(passengerIdValue))
          );
          if (found) travelIdToUse = Number(found.id);
        }
      } catch (e) {
        // ignore
      }

      if (!travelIdToUse) {
        throw new Error('No se pudo determinar el viaje asociado para esta reseña. Califica desde la pantalla de viaje finalizado.');
      }

      await reviewApiService.createReview({
        user_target_id: passengerIdValue,
        travel_id: travelIdToUse,
        starts: reviewRating,
        review: reviewComment,
      });

      setIsReviewModalOpen(false);
      // Try to refresh reviews for the passenger
      try {
        const userReviews = await (await import('@/Services/ReviewApiService')).default.getUserReviews(passengerIdValue).catch(() => null);
        const reviewsArr = (userReviews && (userReviews as any).data && (userReviews as any).data.received) || [];
        if (Array.isArray(reviewsArr) && reviewsArr.length > 0) {
          setPassengerReviews(reviewsArr.map((r: any) => ({
            id: String(r.id ?? Math.random()),
            userName: r.reviewer?.name ?? 'Conductor',
            userAvatar: r.reviewer?.profile_picture ?? '👤',
            rating: Math.round(Number(r.starts ?? r.stars ?? r.rating ?? 0)) || 0,
            comment: r.review ?? r.comment ?? r.body ?? '',
            date: r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : (r.date ?? ''),
            likes: r.likes ?? 0,
          })));
        }
      } catch (e) {
        // ignore
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error?.message ?? 'No se pudo enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color="#121417" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Pasajero</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              {passengerProfile?.profile_picture || getParamValue(params.profile_picture) ? (
                <Image source={{ uri: passengerProfile?.profile_picture ?? getParamValue(params.profile_picture) }} style={styles.profileImagePhoto} />
              ) : (
                <Text style={styles.profileInitial}>{getInitials(passengerProfile?.name ?? String(getParamValue(params.name) ?? 'P'))}</Text>
              )}
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.passengerName}>{displayName}</Text>
            <Text style={styles.passengerRole}>Pasajero</Text>
          </View>
        </View>

        {/* Review modal */}
        <Modal
          visible={isReviewModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsReviewModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Reseñar a {displayName}</Text>
              <StarRating rating={reviewRating} onRatingChange={setReviewRating} size={36} color="#F99F7C" />
              <Text style={styles.commentLabel}>Comentario (opcional)</Text>
              <TextInput
                style={styles.reviewComment}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Escribe tu experiencia..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                maxLength={250}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setIsReviewModalOpen(false)} disabled={submittingReview}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, submittingReview && styles.modalButtonDisabled]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.modalButtonText}>{submittingReview ? 'Enviando...' : 'Enviar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Acerca de</Text>
          </View>
          <Text style={styles.aboutText}>{passengerProfile?.description ?? 'Sin descripción disponible.'}</Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="message-circle" size={20} color="#F99F7C" />
            <Text style={styles.descriptionHeader}>Reseñas</Text>
          </View>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{averageRating ? averageRating.toFixed(2) : '—'}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text key={i} style={styles.star}>{i < Math.round(averageRating ?? 0) ? <FontAwesome name="star" size={24} color="black" /> : <FontAwesome name="star-o" size={24} color="black" />}</Text>
                ))}
              </View>
              <Text style={styles.ratingCount}>{totalReviewsCount} reviews</Text>
            </View>

            <View style={styles.ratingBreakdown}>
              {[5,4,3,2,1].map((star) => (
                <View key={star} style={styles.ratingBar}>
                  <Text style={styles.ratingLabel}>{star}</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: totalReviewsCount ? `${Math.round((ratingCounts[star] || 0) / totalReviewsCount * 100)}%` : '0%' }]} />
                  </View>
                  <Text style={styles.ratingPercentage}>{totalReviewsCount ? `${Math.round((ratingCounts[star] || 0) / totalReviewsCount * 100)}%` : '0%'}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.reviewsList}>
            {passengerReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserInfo}>
                    <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{review.userAvatar}</Text></View>
                    <View style={styles.reviewUserDetails}>
                      <Text style={styles.reviewUserName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>{review.date ? String(review.date).slice(0,10) : ''}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reviewStars}>{Array.from({ length: 5 }, (_, index) => (<Text key={index} style={styles.star}>{index < review.rating ? <FontAwesome name="star" size={24} color="black" /> : <FontAwesome name="star-o" size={24} color="black" />}</Text>))}</View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontFamily: 'Plus Jakarta Sans', fontWeight: 'bold', fontSize: 18, color: '#121417' },
  placeholder: { width: 48, height: 48 },
  scrollContainer: { flex: 1 },
  profileSection: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  profileImageContainer: { marginBottom: 16 },
  profileImage: { width: 128, height: 128, borderRadius: 64, backgroundColor: '#F99F7C', alignItems: 'center', justifyContent: 'center' },
  profileImagePhoto: { width: 128, height: 128, borderRadius: 64 },
  profileInitial: { fontSize: 48, fontWeight: 'bold', color: '#FFFFFF' },
  profileInfo: { alignItems: 'center' },
  passengerName: { fontFamily: 'Plus Jakarta Sans', fontWeight: 'bold', fontSize: 22, color: '#121417', textAlign: 'center', marginBottom: 4 },
  passengerRole: { fontFamily: 'Plus Jakarta Sans', fontSize: 16, color: '#61758A', textAlign: 'center', marginBottom: 4 },
  passengerStats: { fontFamily: 'Plus Jakarta Sans', fontSize: 16, color: '#61758A', textAlign: 'center' },
  section: { paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontFamily: 'Plus Jakarta Sans', fontWeight: 'bold', fontSize: 18, color: '#121417', marginBottom: 12 },
  aboutText: { fontFamily: 'Plus Jakarta Sans', fontSize: 16, color: '#121417' },
  bottomSpacer: { height: 100 },
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
  reviewsList: { gap: 32 },
  reviewCard: { backgroundColor: '#FFFFFF', paddingVertical: 16 },
  reviewHeader: { marginBottom: 12 },
  reviewUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontSize: 20 },
  reviewUserDetails: { flex: 1 },
  reviewUserName: { fontFamily: 'Plus Jakarta Sans', fontWeight: '500', fontSize: 16, lineHeight: 24, color: '#121417', marginBottom: 2 },
  reviewDate: { fontFamily: 'Plus Jakarta Sans', fontSize: 14, lineHeight: 21, color: '#61758A' },
  reviewStars: { flexDirection: 'row', marginBottom: 12, gap: 2 },
  reviewComment: { fontFamily: 'Plus Jakarta Sans', fontSize: 16, lineHeight: 24, color: '#121417', marginBottom: 12 },
  // New styles for review modal and button
  reviewButton: { marginTop: 12, backgroundColor: '#F99F7C', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  reviewButtonText: { fontFamily: 'Plus Jakarta Sans', fontWeight: '600', fontSize: 16, color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 640, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18 },
  modalTitle: { fontFamily: 'Plus Jakarta Sans', fontWeight: '700', fontSize: 18, color: '#121417', marginBottom: 12 },
  commentLabel: { fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: '#121417', marginTop: 12, marginBottom: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 12, backgroundColor: '#F99F7C', borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  modalButtonText: { fontFamily: 'Plus Jakarta Sans', fontWeight: '600', fontSize: 16, color: '#FFFFFF' },
  modalButtonDisabled: { backgroundColor: '#94A3B8' },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  descriptionHeader: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans-Bold",
    fontStyle: "normal",
    lineHeight: 26,
    color: "#121417",
  },
});
