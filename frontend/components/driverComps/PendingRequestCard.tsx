import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export interface PendingRequestCardProps {
  passengerName: string;
  pickupLocation: string;
  destination: string;
  dateLabel: string;
  timeLabel: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function PendingRequestCard({
  passengerName,
  pickupLocation,
  destination,
  dateLabel,
  timeLabel,
  onPress,
  style,
}: PendingRequestCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.badgeRow}>
        <Text style={styles.badgeText}>Pendiente</Text>
        <Text style={styles.passengerText} numberOfLines={1}>
          {passengerName}
        </Text>
      </View>

      <Text style={styles.routeLabel} numberOfLines={2}>
        {pickupLocation} -> {destination}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Fecha</Text>
          <Text style={styles.infoValue}>{dateLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Hora</Text>
          <Text style={styles.infoValue}>{timeLabel}</Text>
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
    backgroundColor: "#F5FBFF",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8ECF7",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  badgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "600",
    color: "#046C9A",
    backgroundColor: "#E0F2FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  passengerText: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    fontWeight: "500",
    color: "#61758A",
  },
  routeLabel: {
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
    color: "#8894A9",
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
    backgroundColor: "#D8ECF7",
  },
});
