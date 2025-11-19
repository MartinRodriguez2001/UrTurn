let googleMapsPromise: Promise<any> | null = null;

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

export const loadGoogleMapsApi = (apiKey?: string): Promise<any> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo está disponible en el navegador'));
  }

  const existingGoogle = (window as any).google;
  if (existingGoogle?.maps) {
    return Promise.resolve(existingGoogle);
  }

  if (!apiKey || apiKey.length === 0) {
    return Promise.reject(new Error('No se configuró la clave de Google Maps'));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const previousScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (previousScript) {
      previousScript.remove();
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const googleObj = (window as any).google;
      if (googleObj?.maps) {
        resolve(googleObj);
      } else {
        reject(new Error('Google Maps no se inicializó correctamente'));
      }
    };

    script.onerror = () => {
      googleMapsPromise = null;
      reject(new Error('No se pudo cargar Google Maps'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
