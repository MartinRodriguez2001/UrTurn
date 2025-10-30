import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const imgDepth3Frame0 =
  "http://localhost:3845/assets/3ab3b593cae411b8b40712ecfd81d32371f70de9.png";
const imgCapturaDePantalla20250928ALaS95019PM1 =
  "http://localhost:3845/assets/69638cdc46134bbf50435d968c296dcb4b5054fe.png";
const imgCapturaDePantalla20250928ALaS95151PM1 =
  "http://localhost:3845/assets/7ad11b481bbb1fcf2d8ffe7c4acd74cfff1934f8.png";
const imgDepth4Frame0 =
  "http://localhost:3845/assets/45cbddf4ea78015be6a898e3eff4d182ef6ed62d.svg";
const imgVector1 =
  "http://localhost:3845/assets/b6574480d4398ca143796040abbf81574adb02d5.svg";
const imgVector2 =
  "http://localhost:3845/assets/3370ea0928ad54a8bdeb6d9fdee45593bd3b265e.svg";
const imgDepth4Frame1 =
  "http://localhost:3845/assets/629cc3192dacb040da73496cb8c1c028c2e2e4ea.svg";

export default function DriverOnTravel() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={22} color="#121417" />
          </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Solicitar un viaje</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={{ uri: imgDepth4Frame0 }} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Viaje en curso</Text>
        </View>

        <View style={styles.mapCard}>
          <Image source={{ uri: imgDepth3Frame0 }} style={styles.mapImage} />
          {/* Small markers - simplified from MCP */}
          <Image
            source={{ uri: imgCapturaDePantalla20250928ALaS95019PM1 }}
            style={[
              styles.marker,
              { left: 148, top: 179, transform: [{ rotate: "236deg" }] },
            ]}
          />
          <Image
            source={{ uri: imgCapturaDePantalla20250928ALaS95151PM1 }}
            style={[styles.markerSmall, { left: 46, top: 119 }]}
          />
          <Image
            source={{ uri: imgCapturaDePantalla20250928ALaS95151PM1 }}
            style={[styles.markerSmall, { left: 184, top: 215 }]}
          />
          <Image
            source={{ uri: imgVector1 }}
            style={[styles.vector, { left: 61, top: 99 }]}
          />
          <Image
            source={{ uri: imgVector2 }}
            style={[styles.vectorSmall, { left: 165, top: 200 }]}
          />
        </View>

        <View style={styles.etaRow}>
          <View style={styles.iconBox}>
            <Image source={{ uri: imgDepth4Frame1 }} style={styles.icon} />
          </View>
          <View style={styles.etaText}>
            <Text style={styles.etaLabel}>Tiempo estimado de llegada</Text>
            <Text style={styles.etaValue}>Llegada estimada: 10:30 AM</Text>
          </View>
        </View>

        <View style={styles.reportRow}>
          <TouchableOpacity style={styles.reportButton} activeOpacity={0.8}>
            <Text style={styles.reportButtonText}>Reportar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.finishButton} activeOpacity={0.8}>
          <Text style={styles.finishButtonText}>Terminar viaje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  headerIcon: { width: 24, height: 24, marginRight: 12, resizeMode: "contain" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#121417" },
  mapCard: {
    height: 458,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  mapImage: { width: "100%", height: "100%", resizeMode: "cover" },
  marker: { position: "absolute", width: 22, height: 9, resizeMode: "cover" },
  markerSmall: {
    position: "absolute",
    width: 13,
    height: 14,
    resizeMode: "cover",
  },
  vector: {
    position: "absolute",
    width: 91,
    height: 82,
    resizeMode: "contain",
  },
  vectorSmall: {
    position: "absolute",
    width: 20,
    height: 25,
    resizeMode: "contain",
  },
  etaRow: {
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
  etaText: { flex: 1 },
  etaLabel: { fontSize: 16, fontWeight: "500", color: "#121417" },
  etaValue: { fontSize: 14, color: "#61758a", marginTop: 2 },
  reportRow: { paddingVertical: 12 },
  reportButton: {
    backgroundColor: "#f0f2f5",
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reportButtonText: { fontSize: 14, fontWeight: "700", color: "#121417" },
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },
  finishButton: {
    backgroundColor: "#f99f7c",
    width: "92%",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  finishButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
    paddingHorizontal: 20,
  },
  placeholder: {
    width: 48,
    height: 48,
  },
});
