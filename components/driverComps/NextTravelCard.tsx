import { View, Text, StyleSheet } from "react-native";


export interface NextTravelCardProps {
    Route: string
    Date: string
    Time: string
}
export default function NextTravelCard({Route, Date, Time}: NextTravelCardProps) {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripInfo}>
        <Text style={styles.tripLabel}>Próximo</Text>
        <Text style={styles.tripDestination}>
          {Route}
        </Text>
        <Text style={styles.tripTime}>{Date}, {Time}</Text>
      </View>
      <View style={styles.tripImageContainer}>
        <View style={styles.tripImagePlaceholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    tripCard: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    tripInfo: {
        flex: 1,
        paddingRight: 16,
    },
    tripLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#876363',
        marginBottom: 4,
    },
    tripDestination: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 20,
        color: '#121417',
        marginBottom: 4,
    },
    tripTime: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#876363',
    },
    tripImageContainer: {
        width: 130,
        height: 90,
    },
    tripImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
    },
})