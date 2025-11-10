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

interface Driver {
  id: number;
  name: string;
  profile_picture?: string | null;
}

export default function Passenger_Travel_ended() {
  const router = useRouter();
  const params = useLocalSearchParams<{ travelId?: string }>();
  const travelId = params.travelId ? parseInt(params.travelId) : null;

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [currentStep, setCurrentStep] = useState<'review' | 'completed'>('review');

  useEffect(() => {
    if (travelId) {
      loadDriver();
    } else {
      setLoading(false);
    }
  }, [travelId]);

  const loadDriver = async () => {
    if (!travelId) return;

    try {
      setLoading(true);
      let driverInfo: any = null;

      // Intento primario: endpoint directo (si está implementado en backend)
      try {
        const response = await travelApiService.getTravelById(travelId);
        if (response.success && response.travel) {
          driverInfo = (response.travel as any).driver_id;
        }
      } catch (err) {
        // Ignorar y usar fallback
      }

      // Fallback: buscar en listas de viajes del pasajero
      if (!driverInfo) {
        try {
          const passengerTravels = await travelApiService.getPassengerTravels();
          if (passengerTravels.success && passengerTravels.data) {
            const allTravels: any[] = [
              ...(passengerTravels.data.confirmed || []).map(t => t.travel).filter(Boolean),
              ...(passengerTravels.data.requested || []).map(t => t.travel).filter(Boolean),
            ];
            const match = allTravels.find(t => t && t.id === travelId);
            if (match) {
              driverInfo = match.driver_id;
            }
          }
        } catch (err) {
          // Silenciar
        }
      }

      if (driverInfo) {
        setDriver({
          id: driverInfo.id,
          name: driverInfo.name,
          profile_picture: driverInfo.profile_picture,
        });
      }
    } catch (error) {
      console.error('Error loading driver:', error);
      Alert.alert('Error', 'No se pudo cargar la información del conductor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!travelId || !driver) {
      router.push('/Passenger/PassengerHomePage' as any);
      return;
    }

    try {
      setSubmitting(true);

      await reviewApiService.createReview({
        user_target_id: driver.id,
        travel_id: travelId,
        starts: rating,
        review: comment || '',
      });
      
      setCurrentStep('completed');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'No se pudo enviar la reseña. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipReview = () => {
    Alert.alert(
      'Omitir reseña',
      '¿Estás seguro de que quieres omitir la reseña? Esto ayuda a mejorar la experiencia de la comunidad.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Omitir', 
          style: 'destructive',
          onPress: () => router.push('/Passenger/PassengerHomePage' as any)
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
            Tu reseña ayuda a mejorar la experiencia de la comunidad
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Passenger/PassengerHomePage' as any)}
          >
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Feather name="flag" size={48} color="#F99F7C" />
          <Text style={styles.title}>Viaje finalizado</Text>
          <Text style={styles.subtitle}>No se pudo cargar la información del conductor</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Passenger/PassengerHomePage' as any)}
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
            ¿Cómo fue tu experiencia con el conductor?
          </Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            {driver.profile_picture ? (
              <Image
                source={{ uri: driver.profile_picture }}
                style={styles.profilePicture}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Feather name="user" size={24} color="#64748B" />
              </View>
            )}
            <Text style={styles.driverName}>{driver.name}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Calificación</Text>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={40}
              color="#F99F7C"
            />
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe tu experiencia con el conductor..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={250}
            />
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipReview}
            disabled={submitting}
          >
            <Text style={styles.skipButtonText}>Omitir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar reseña</Text>
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
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    gap: 20,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  ratingSection: {
    gap: 12,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
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
    minHeight: 100,
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
