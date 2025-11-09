import StarRating from '@/components/common/StarRating';
import reviewApiService from '@/Services/ReviewApiService';
import travelApiService from '@/Services/TravelApiService';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Passenger {
  id: number;
  name: string;
  profile_picture?: string | null;
}

interface PassengerReview {
  passengerId: number;
  rating: number;
  comment: string;
}

export default function Driver_Travel_ended() {
  const router = useRouter();
  const params = useLocalSearchParams<{ travelId?: string }>();
  const travelId = params.travelId ? parseInt(params.travelId) : null;

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Record<number, PassengerReview>>({});
  const [currentStep, setCurrentStep] = useState<'review' | 'completed'>('review');

  useEffect(() => {
    if (travelId) {
      loadPassengers();
    } else {
      setLoading(false);
    }
  }, [travelId]);

  const loadPassengers = async () => {
    if (!travelId) return;

    try {
      setLoading(true);
      let confirmedPassengers: Passenger[] = [];

      // Intento primario: endpoint directo (requiere soporte backend)
      try {
        const response = await travelApiService.getTravelById(travelId);
        if (response.success && response.travel) {
          confirmedPassengers = (response.travel.passengers?.confirmed || []) as Passenger[];
        }
      } catch (err) {
        // Ignorar y probar fallback
      }

      // Fallback: obtener todos los viajes del conductor y buscar el que coincide
      if (!confirmedPassengers.length) {
        try {
          const driverTravels = await travelApiService.getDriverTravels();
          if (driverTravels.success && driverTravels.travels) {
            const match = driverTravels.travels.find(t => t.id === travelId);
            if (match) {
              confirmedPassengers = (match.passengers?.confirmed || []) as Passenger[];
            }
          }
        } catch (err) {
          // Silenciar; se manejará más abajo si continua vacío
        }
      }

      setPassengers(confirmedPassengers);

      const initialReviews: Record<number, PassengerReview> = {};
      confirmedPassengers.forEach((p) => {
        initialReviews[p.id] = { passengerId: p.id, rating: 5, comment: '' };
      });
      setReviews(initialReviews);
    } catch (error) {
      console.error('Error loading passengers:', error);
      Alert.alert('Error', 'No se pudieron cargar los pasajeros del viaje');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (passengerId: number, rating: number) => {
    setReviews((prev) => ({
      ...prev,
      [passengerId]: {
        ...prev[passengerId],
        rating,
      },
    }));
  };

  const handleCommentChange = (passengerId: number, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [passengerId]: {
        ...prev[passengerId],
        comment,
      },
    }));
  };

  const handleSubmitReviews = async () => {
    if (!travelId) {
      router.push('/Driver/DriverHomePage' as any);
      return;
    }

    try {
      setSubmitting(true);

      // Enviar cada reseña al backend
      const reviewPromises = Object.values(reviews).map((review) =>
        reviewApiService.createReview({
          user_target_id: review.passengerId,
          travel_id: travelId,
          starts: review.rating,
          review: review.comment || 'Sin comentarios',
        })
      );

      await Promise.all(reviewPromises);
      
      setCurrentStep('completed');
    } catch (error) {
      console.error('Error submitting reviews:', error);
      Alert.alert('Error', 'No se pudieron enviar las reseñas. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipReviews = () => {
    Alert.alert(
      'Omitir reseñas',
      '¿Estás seguro de que quieres omitir las reseñas? Esto ayuda a mejorar la experiencia de la comunidad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Omitir', 
          style: 'destructive',
          onPress: () => router.push('/Driver/DriverHomePage' as any)
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F99F7C" />
      </SafeAreaView>
    );
  }

  if (currentStep === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Feather name="check-circle" size={64} color="#F99F7C" />
          <Text style={styles.title}>¡Gracias por tu opinión!</Text>
          <Text style={styles.completedSubtitle}>
            Tus reseñas ayudan a mejorar la experiencia de la comunidad
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Driver/DriverHomePage' as any)}
          >
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (passengers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Feather name="flag" size={48} color="#F99F7C" />
          <Text style={styles.title}>Viaje finalizado</Text>
          <Text style={styles.subtitle}>No hubo pasajeros en este viaje</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Driver/DriverHomePage' as any)}
          >
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Feather name="flag" size={40} color="#F99F7C" />
          <Text style={styles.title}>Viaje finalizado</Text>
          <Text style={styles.subtitle}>
            ¿Cómo fue tu experiencia con los pasajeros?
          </Text>
        </View>

        {passengers.map((passenger) => (
          <View key={passenger.id} style={styles.passengerCard}>
            <View style={styles.passengerHeader}>
              {passenger.profile_picture ? (
                <Image
                  source={{ uri: passenger.profile_picture }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Feather name="user" size={24} color="#64748B" />
                </View>
              )}
              <Text style={styles.passengerName}>{passenger.name}</Text>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Calificación</Text>
              <StarRating
                rating={reviews[passenger.id]?.rating || 0}
                onRatingChange={(rating) => handleRatingChange(passenger.id, rating)}
                size={36}
                color="#F99F7C"
              />
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Comentario (opcional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Escribe tu experiencia con este pasajero..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={reviews[passenger.id]?.comment || ''}
                onChangeText={(text) => handleCommentChange(passenger.id, text)}
                maxLength={250}
              />
            </View>
          </View>
        ))}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipReviews}
            disabled={submitting}
          >
            <Text style={styles.skipButtonText}>Omitir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitReviews}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar reseñas</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  passengerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  ratingSection: {
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  commentSection: {
    gap: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#F99F7C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#F4C6B5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121417',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#61758a',
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 15,
    color: '#61758a',
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 18,
    backgroundColor: '#F99F7C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
