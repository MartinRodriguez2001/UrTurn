import { Text, View, StyleSheet } from "react-native";

export interface RequestCardProps {
    RequestCount: number;
    Route: string;
}

export default function RequestsCard({RequestCount, Route}: RequestCardProps) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestIcon}>
        <Text style={styles.carIcon}>🚗</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestCount}>{RequestCount} solicitud</Text>
        <Text style={styles.requestRoute}>{Route}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    requestIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    carIcon: {
        fontSize: 24,
    },
    requestInfo: {
        flex: 1,
    },
    requestCount: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    requestRoute: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#876363',
    },
})
