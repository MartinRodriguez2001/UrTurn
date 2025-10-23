import Constants from "expo-constants";

type Extras = Record<string, unknown>;

const collectExtras = (): Extras[] => {
  const sources: Extras[] = [];

  const pushIfObject = (value: unknown) => {
    if (value && typeof value === "object") {
      sources.push(value as Extras);
    }
  };

  pushIfObject(Constants?.expoConfig?.extra);
  pushIfObject((Constants as unknown as { manifest?: Extras })?.manifest?.extra);
  pushIfObject((Constants as unknown as { manifest2?: Extras })?.manifest2?.extra);
  pushIfObject((Constants as unknown as { manifest2?: { expoClient?: Extras } })?.manifest2?.expoClient?.extra);

  return sources;
};

export const resolveGoogleMapsApiKey = (): string => {
  const candidates: Array<string | undefined> = [
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ID,
    process.env.GOOGLE_MAPS_ID,
  ];

  for (const extras of collectExtras()) {
    candidates.push(
      extras.EXPO_PUBLIC_GOOGLE_MAPS_ID as string | undefined,
      extras.GOOGLE_MAPS_ID as string | undefined,
      extras.googleMapsApiKey as string | undefined,
      extras.googleMapsId as string | undefined,
      extras.expoPublicGoogleMapsId as string | undefined,
    );
  }

  return (
    candidates.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ??
    ""
  );
};

