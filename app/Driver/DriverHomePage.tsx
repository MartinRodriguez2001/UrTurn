import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import RequestsCard from '@/components/RequestsCard';
import NextTravelCard from '@/components/NextTravelCard';

export default function DriverHomePage() {
    const router = useRouter();

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
                    <Text style={styles.headerTitle}>Pagina Principal</Text>
                </View>
                
                <TouchableOpacity style={styles.profileButton}>
                    <View style={styles.profileImage}>
                        <Text style={styles.profileInitial}>U</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Published Trips Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Viajes Publicados</Text>
                    <NextTravelCard Route="Universidad de los Andes" Date="Hoy" Time="15:00 - 15:30"/>
                </View>

                {/* Pending Requests Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Solicitudes Pendientes</Text>
                    <RequestsCard RequestCount={1} Route='Santiago'/>
                </View>

                {/* Spacer for bottom navigation */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Publish New Trip Button */}
            <View style={styles.publishButtonContainer}>
                <TouchableOpacity style={styles.publishButton} onPress={() => router.push("/Driver/PublishTravel")}>
                    <Text style={styles.publishIcon}>+</Text>
                    <Text style={styles.publishText}>Publicar Nuevo Viaje</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 59,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 11,
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
    profileButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F99F7C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 22,
        lineHeight: 28,
        color: '#121417',
        marginBottom: 16,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    bottomSpacer: {
        height: 200, // Space for bottom elements
    },
    publishButtonContainer: {
        position: 'absolute',
        bottom: 151,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F99F7C',
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 20,
    },
    publishIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginRight: 8,
    },
    publishText: {
        fontFamily: 'Plus Jakarta Sans',
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    bottomNavigation: {
        flexDirection: 'row',
        height: 75,
        backgroundColor: '#FFFFFF',
        paddingTop: 9,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    navLabel: {
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        lineHeight: 18,
        color: '#121417',
        textAlign: 'center',
    },
});