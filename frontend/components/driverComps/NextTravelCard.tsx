import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export interface NextTravelCardProps {
  Route: string;
  Date: string;
  Time: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function NextTravelCard({
  Route,
  Date,
  Time,
  onPress,
  style,
}: NextTravelCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.badgeText}>Programado</Text>
      <Text style={styles.routeText} numberOfLines={2}>
        {Route}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Fecha</Text>
          <Text style={styles.infoValue}>{Date}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Hora</Text>
          <Text style={styles.infoValue}>{Time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexShrink: 0,
    minWidth: 240,
    borderRadius: 16,
    backgroundColor: "#FDF8F5",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FCE0D3",
  },
  badgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "600",
    color: "#F97316",
    backgroundColor: "#FFECE3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  routeText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "600",
    color: "#121417",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    fontWeight: "600",
    color: "#121417",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#FCE0D3",
  },
});
