import { userApi } from '@/Services/UserApiService';
import VehicleApiService from '@/Services/VehicleApiService';
import { useEffect, useState } from 'react';

export const useDriverStatus = () => {
  const [isDriver, setIsDriver] = useState(false);
  const [hasVehicles, setHasVehicles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkDriverStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useDriverStatus: Verificando estado del conductor...');

      // Verificar si tiene vehículos directamente (esto es lo que realmente importa)
      const vehiclesResponse = await VehicleApiService.checkUserHasVehicles();
      console.log('🚗 useDriverStatus: Respuesta de vehículos:', vehiclesResponse);
      
      if (vehiclesResponse.success) {
        // Ahora la respuesta tiene hasVehicles en data
        const userHasVehicles = vehiclesResponse.data?.hasVehicles || false;
        setHasVehicles(userHasVehicles);
        console.log('✅ useDriverStatus: Usuario tiene vehículos:', userHasVehicles);
        
        // También verificar el perfil del usuario
        const profileResponse = await userApi.getProfile();
        console.log('👤 useDriverStatus: Respuesta del perfil:', profileResponse);
        
        if (profileResponse.success && profileResponse.data) {
          const userIsDriver = profileResponse.data.IsDriver;
          setIsDriver(userIsDriver);
          console.log('✅ useDriverStatus: Usuario es driver en BD:', userIsDriver);
        } else {
          console.log('❌ useDriverStatus: Error al obtener perfil');
          setIsDriver(false);
        }
      } else {
        console.log('❌ useDriverStatus: Error al verificar vehículos:', vehiclesResponse.message);
        setHasVehicles(false);
        setIsDriver(false);
        setError(vehiclesResponse.message || 'Error al verificar vehículos');
      }
    } catch (error) {
      console.error('❌ useDriverStatus: Error en checkDriverStatus:', error);
      setError('Error al verificar estado del conductor');
      setIsDriver(false);
      setHasVehicles(false);
    } finally {
      setLoading(false);
      console.log('🏁 useDriverStatus: Verificación completada');
    }
  };

  useEffect(() => {
    checkDriverStatus();
  }, []);

  const refreshStatus = async () => {
    console.log('🔄 useDriverStatus: Refrescando estado...');
    await checkDriverStatus();
  };

  // El usuario puede acceder al modo driver si tiene vehículos (independientemente del flag IsDriver)
  const canAccessDriverMode = hasVehicles;
  const needsVehicleRegistration = isDriver && !hasVehicles;

  console.log('📊 useDriverStatus: Estado actual:', {
    isDriver,
    hasVehicles,
    canAccessDriverMode,
    needsVehicleRegistration,
    loading
  });

  return {
    isDriver,
    hasVehicles,
    loading,
    error,
    refreshStatus,
    // Estado combinado para facilitar el uso
    canAccessDriverMode,
    needsVehicleRegistration
  };
};
