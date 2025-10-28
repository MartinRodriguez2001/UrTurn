import TravelApiService from '@/Services/TravelApiService';
import { useState } from 'react';

interface TravelRequestParams {
  travelId: number;
  pickupLocation: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLocation: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupDate?: Date;
  pickupTime?: Date;
}

export const useTravelRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestTravel = async ({
    travelId,
    pickupLocation,
    pickupLatitude,
    pickupLongitude,
    dropoffLocation,
    dropoffLatitude,
    dropoffLongitude,
    pickupDate,
    pickupTime
  }: TravelRequestParams) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      console.log('=== 🔍 useTravelRequest: Iniciando solicitud de viaje ===');
      console.log('📋 Parámetros recibidos:', {
        travelId,
        pickupLocation,
        dropoffLocation,
        pickupDate: pickupDate?.toISOString(),
        pickupTime: pickupTime?.toISOString(),
      });

      // Validaciones previas
      if (!travelId) {
        console.log('❌ useTravelRequest: ID de viaje no válido');
        throw new Error('ID de viaje no válido');
      }

      if (!pickupLocation || pickupLocation.trim() === '') {
        console.log('❌ useTravelRequest: Ubicación de recogida vacía');
        throw new Error('La ubicación de recogida es requerida');
      }

      if (!dropoffLocation || dropoffLocation.trim() === '') {
        console.log('❌ useTravelRequest: Ubicación de destino vacía');
        throw new Error('La ubicación de destino es requerida');
      }

      if (!Number.isFinite(pickupLatitude) || Math.abs(pickupLatitude) > 90) {
        console.log('❌ useTravelRequest: Latitud de recogida inválida');
        throw new Error('La latitud de recogida es inválida');
      }

      if (!Number.isFinite(pickupLongitude) || Math.abs(pickupLongitude) > 180) {
        console.log('❌ useTravelRequest: Longitud de recogida inválida');
        throw new Error('La longitud de recogida es inválida');
      }

      if (!Number.isFinite(dropoffLatitude) || Math.abs(dropoffLatitude) > 90) {
        console.log('❌ useTravelRequest: Latitud de destino inválida');
        throw new Error('La latitud de destino es inválida');
      }

      if (!Number.isFinite(dropoffLongitude) || Math.abs(dropoffLongitude) > 180) {
        console.log('❌ useTravelRequest: Longitud de destino inválida');
        throw new Error('La longitud de destino es inválida');
      }

      console.log('✅ useTravelRequest: Validaciones previas pasadas');
      console.log('📡 useTravelRequest: Enviando solicitud al backend...');

      const response = await TravelApiService.requestToJoinTravel(
        travelId,
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        dropoffLocation,
        dropoffLatitude,
        dropoffLongitude,
        pickupDate,
        pickupTime
      );

      console.log('📨 useTravelRequest: Respuesta del backend:', {
        success: response.success,
        message: response.message,
      });

      if (response.success) {
        console.log('✅ useTravelRequest: Solicitud creada exitosamente');
        if ('request' in response) {
          console.log('📦 Datos de la solicitud:', response.request);
        }
        setSuccess(true);
        return response;
      } else {
        console.log('❌ useTravelRequest: Error del servidor:', response.message);
        throw new Error(response.message || 'Error al solicitar el viaje');
      }
    } catch (err) {
      console.error('❌ useTravelRequest: Error capturado:', err);
      console.error('Tipo de error:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Mensaje:', err instanceof Error ? err.message : String(err));
      
      const errorMessage = err instanceof Error ? err.message : 'Error al solicitar el viaje';
      setError(errorMessage);
      setSuccess(false);
      
      throw err;
    } finally {
      setLoading(false);
      console.log('=== 🏁 useTravelRequest: Proceso finalizado ===\n');
    }
  };

  const resetState = () => {
    console.log('🔄 useTravelRequest: Reseteando estado');
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    requestTravel,
    loading,
    error,
    success,
    resetState,
  };
};
