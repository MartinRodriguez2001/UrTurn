import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Driver {
    id: string;
    name: string;
    vehicle: string;
    price: string;
    avatar: string;
}

export default function PassengerRiderOffers() {
    const router = useRouter();
    const { pickupDate, pickupTime, pickupLocation } = useLocalSearchParams();

    const drivers: Driver[] = [
        {
            id: '1',
            name: 'Victor',
            vehicle: 'Porsche',
            price: '300 CLP',
            avatar: '👨‍💼'
        },
        {
            id: '2',
            name: 'Catalina',
            vehicle: 'Ferrari',
            price: '5000 CLP',
            avatar: '👩‍💼'
        },
        {
            id: '3',
            name: 'Jorge',
            vehicle: 'Ford Focus',
            price: '1500 CLP',
            avatar: '👨‍🔧'
        }
    ];

    const filterOptions = [
        { id: '1', label: 'Precio', icon: '💰' },
        { id: '2', label: 'Ubicación', icon: '📍' },
        { id: '3', label: 'Calificación', icon: '⭐' },
        { id: '4', label: 'Tipo de vehículo', icon: '🚗' }
    ];

    const renderFilterOption = ({ item }: { item: { id: string; label: string; icon: string } }) => (
        <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterLabel}>{item.label}</Text>
            <Text style={styles.filterIcon}>▼</Text>
        </TouchableOpacity>
    );

    const renderDriver = ({ item }: { item: Driver }) => (
        <TouchableOpacity 
            style={styles.driverCard}
            onPress={() =>
                router.push({
                    pathname: "/Passenger/PassengerDriverProfile",
                    params: {
                        name: item.name,
                        vehicle: item.vehicle,
                        price: item.price,
                        travelId: item.id,
                        pickupDate: typeof pickupDate === 'string' ? pickupDate : '',
                        pickupTime: typeof pickupTime === 'string' ? pickupTime : '',
                        pickupLocation: typeof pickupLocation === 'string' ? pickupLocation : '',
                    },
                })
            }
        >
            <View style={styles.driverInfo}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>{item.avatar}</Text>
                </View>
                <View style={styles.driverDetails}>
                    <Text style={styles.driverName}>{item.name}</Text>
                    <Text style={styles.vehicleName}>{item.vehicle}</Text>
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.price}>{item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>Conductores disponibles</Text>
                </View>
                
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Filter Options */}
                <View style={styles.filterContainer}>
                    <FlatList
                        data={filterOptions}
                        renderItem={renderFilterOption}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterList}
                    />
                </View>

                {/* Section Title */}
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Conductores disponibles</Text>
                </View>

                {/* Drivers List */}
                <View style={styles.driversList}>
                    {drivers.map((driver) => (
                        <View key={driver.id}>
                            {renderDriver({ item: driver })}
                        </View>
                    ))}
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 67,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#121417',
        fontWeight: 'bold',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
        textAlign: 'center',
    },
    placeholder: {
        width: 48,
        height: 48,
    },
    scrollContainer: {
        flex: 1,
    },
    filterContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    filterList: {
        gap: 12,
    },
    filterButton: {
        backgroundColor: '#F0F2F5',
        height: 32,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingRight: 8,
        gap: 8,
    },
    filterLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 21,
        color: '#121417',
    },
    filterIcon: {
        fontSize: 20,
        color: '#121417',
    },
    sectionTitleContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 23,
        color: '#121417',
    },
    driversList: {
        paddingHorizontal: 0,
        paddingRight: 80,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 72,
        backgroundColor: '#FFFFFF',
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F2F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        fontSize: 32,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 24,
        color: '#121417',
        marginBottom: 2,
    },
    vehicleName: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 14,
        lineHeight: 21,
        color: '#61758A',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 16,
        lineHeight: 20,
        color: '#121417',
    },
    bottomSpacer: {
        height: 100,
    },
    bottomNavigation: {
        flexDirection: 'row',
        height: 75,
        backgroundColor: '#FFFFFF',
        paddingTop: 9,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        gap: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navIcon: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navIconActive: {
        fontSize: 24,
        height: 32,
        textAlignVertical: 'center',
    },
    navLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#61758A',
        textAlign: 'center',
    },
    navLabelActive: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 18,
        color: '#121417',
        textAlign: 'center',
    },
});
