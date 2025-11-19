import { Platform } from "react-native";
import * as ExpoLocation from "expo-location";

type PermissionResponse = { status: string };

export const PermissionStatus = ExpoLocation.PermissionStatus;
export const Accuracy = ExpoLocation.Accuracy;

const mapPermissionState = (state: string | undefined) => {
  if (!state) return ExpoLocation.PermissionStatus.DENIED;
  if (state === "granted") return ExpoLocation.PermissionStatus.GRANTED;
  if (state === "prompt") return ExpoLocation.PermissionStatus.DENIED;
  return ExpoLocation.PermissionStatus.DENIED;
};

export async function getForegroundPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).permissions) {
    try {
      const res = await (navigator as any).permissions.query({ name: "geolocation" });
      return { status: mapPermissionState(res.state) };
    } catch (e) {
      // Fall back to expo-location
    }
  }
  const resp = await ExpoLocation.getForegroundPermissionsAsync();
  return { status: resp.status };
}

export async function requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS === "web") {
    // Attempt to trigger the browser permission prompt by requesting current position
    try {
      await new Promise<void>((resolve) => {
        if (!navigator?.geolocation?.getCurrentPosition) return resolve();
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          () => resolve(),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
      });
    } catch (e) {
      // ignore
    }
    return getForegroundPermissionsAsync();
  }

  const resp = await ExpoLocation.requestForegroundPermissionsAsync();
  return { status: resp.status };
}

export async function getCurrentPositionAsync(options?: any): Promise<any> {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation?.getCurrentPosition) {
        return reject(new Error("Geolocation not available"));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? 0,
              altitude: pos.coords.altitude ?? null,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
              altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
            },
            timestamp: pos.timestamp,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    });
  }

  return ExpoLocation.getCurrentPositionAsync(options ?? {});
}

export async function getLastKnownPositionAsync(): Promise<any | null> {
  if (Platform.OS === "web") {
    // Browser does not expose last-known; return null so callers can use current
    return null;
  }
  return ExpoLocation.getLastKnownPositionAsync();
}

export async function watchPositionAsync(options: any, callback: (loc: any) => void) {
  if (Platform.OS === "web") {
    if (!navigator?.geolocation?.watchPosition) {
      throw new Error("Geolocation.watchPosition not available");
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        callback({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? 0,
            altitude: pos.coords.altitude ?? null,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
            altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
          },
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        // ignore or forward as needed
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return {
      remove: () => {
        try {
          navigator.geolocation.clearWatch(id);
        } catch (e) {
          // ignore
        }
      },
    };
  }

  const subscription = await ExpoLocation.watchPositionAsync(options, (loc) => callback(loc));
  return subscription;
}

export default {
  PermissionStatus,
  Accuracy,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  watchPositionAsync,
};
