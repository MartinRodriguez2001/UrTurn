import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";

const imgDepth3Frame0 =
  "http://localhost:3845/assets/c0569bb0c4ca8b5554b1b3fc9930287f768da18d.png";
const imgDepth3Frame1 =
  "http://localhost:3845/assets/02b0beac4266c208fec8ce95795c591c4dc34b61.png";
const imgDepth4Frame0 =
  "http://localhost:3845/assets/45cbddf4ea78015be6a898e3eff4d182ef6ed62d.svg";
const imgDepth4Frame1 =
  "http://localhost:3845/assets/bbd025f16df453ad130d9e1b69a2a893372aec89.svg";
const imgDepth4Frame2 =
  "http://localhost:3845/assets/629cc3192dacb040da73496cb8c1c028c2e2e4ea.svg";
const imgDepth4Frame3 =
  "http://localhost:3845/assets/065b377f553169d9f1adc65ef07c4f4aae1eb3e2.svg";

export default function DriverTravel() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
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
      </View>

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: imgDepth4Frame0 }}
              style={styles.headerIcon}
            />
            <Text style={styles.headerTitle}>Viaje</Text>
          </View>

          <View style={styles.imageCard}>
            <Image source={{ uri: imgDepth3Frame0 }} style={styles.cardImage} />
          </View>

          <Text style={styles.sectionTitle}>Detalles del viaje</Text>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={{ uri: imgDepth4Frame1 }} style={styles.icon} />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Origen</Text>
              <Text style={styles.detailValue}>Universidad de los Andes</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={{ uri: imgDepth4Frame1 }} style={styles.icon} />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Destino</Text>
              <Text style={styles.detailValue}>Francisco Bilbao 2567</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={{ uri: imgDepth4Frame2 }} style={styles.icon} />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Hora de Inicio</Text>
              <Text style={styles.detailValue}>15:30</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={{ uri: imgDepth4Frame3 }} style={styles.icon} />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Precio</Text>
              <Text style={styles.detailValue}>1.000 CLP</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Pasajeros confirmados
          </Text>

          <View style={styles.passengerRow}>
            <Image
              source={{ uri: imgDepth3Frame1 }}
              style={styles.passengerAvatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.passengerName}>Sofia Mendoza</Text>
              <Text style={styles.passengerRole}>Pasajero</Text>
            </View>

            <TouchableOpacity style={styles.contactButton} activeOpacity={0.8}>
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push("/Driver/DriverOnTravel")}
          >
            <Text style={styles.primaryButtonText}>Empezar viaje</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 16, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  headerIcon: { width: 24, height: 24, marginRight: 12, resizeMode: "contain" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#121417" },
  imageCard: {
    height: 201,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121417",
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: { width: 24, height: 24, resizeMode: "contain" },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 16, fontWeight: "500", color: "#121417" },
  detailValue: { fontSize: 14, color: "#61758a", marginTop: 2 },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  passengerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: "cover",
  },
  passengerName: { fontSize: 16, fontWeight: "500", color: "#121417" },
  passengerRole: { fontSize: 14, color: "#61758a" },
  contactButton: {
    backgroundColor: "#f99f7c",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contactButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#f99f7c",
    width: "92%",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#121417",
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  profileButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
