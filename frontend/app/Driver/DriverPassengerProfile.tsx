import travelApiService from '@/Services/TravelApiService';
import { userApi } from '@/Services/UserApiService';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
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
        const travelsRes = await travelApiService.getTravelsByPassengerId(passengerId).catch(() => null);
        const travels: any[] = (travelsRes && (travelsRes as any).travels) || (travelsRes && (travelsRes as any).data && (travelsRes as any).data.travels) || [];

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
                date: r.created_at ? new Date(r.created_at).toLocaleDateString('es-CL') : (r.date ?? ''),
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

        setPassengerReviews(gatheredReviews);
        setRatingCounts(counts);
        setTotalReviewsCount(total);
        setAverageRating(total > 0 ? sum / total : null);
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
            <Text style={styles.passengerStats}>{passengerProfile?.phone_number ?? getParamValue(params.phone) ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.aboutText}>{passengerProfile?.description ?? 'Sin descripción disponible.'}</Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reseñas de conductores</Text>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingNumber}>{averageRating ? averageRating.toFixed(2) : '—'}</Text>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text key={i} style={styles.star}>{i < Math.round(averageRating ?? 0) ? '⭐' : '☆'}</Text>
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
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reviewStars}>{Array.from({ length: 5 }, (_, index) => (<Text key={index} style={styles.star}>{index < review.rating ? '⭐' : '☆'}</Text>))}</View>
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
  profileImage: { width: 128, height: 128, borderRadius: 64, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  profileImagePhoto: { width: 128, height: 128, borderRadius: 64 },
  profileInitial: { fontSize: 48, fontWeight: 'bold', color: '#121417' },
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
});
