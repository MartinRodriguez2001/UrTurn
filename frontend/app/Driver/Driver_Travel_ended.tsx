import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Driver_Travel_ended() {
  const router = useRouter();
  const params = useLocalSearchParams<{ travelId?: string }>();
  const travelId = params.travelId ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Feather name="flag" size={48} color="#065F46" />
        <Text style={styles.title}>Viaje finalizado</Text>
        {travelId ? (
          <Text style={styles.subtitle}>ID del viaje: {travelId}</Text>
        ) : null}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  card: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#065F46',
  },
  subtitle: {
    fontSize: 14,
    color: '#334155',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
