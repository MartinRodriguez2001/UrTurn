import TravelApiService from '@/Services/TravelApiService';
import { useState } from 'react';

interface TravelRequestParams {
  travelId: number;
  pickupLocation: string;
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

      console.log('✅ useTravelRequest: Validaciones previas pasadas');
      console.log('📡 useTravelRequest: Enviando solicitud al backend...');

      const response = await TravelApiService.requestToJoinTravel(
        travelId,
        pickupLocation,
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
