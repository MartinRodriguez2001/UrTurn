import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const SettingsPlaceholder = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    description?: string;
    context?: string;
  }>();

  const title = params.title ?? "Próximamente";
  const description =
    params.description ??
    "Estamos preparando esta sección. Pronto estará disponible.";
  const context = params.context ?? "";

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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messageCard}>
          <View style={styles.iconContainer}>
            <Feather name="tool" size={28} color="#F99F7C" />
          </View>
          <Text style={styles.messageTitle}>Funcionalidad en desarrollo</Text>
          <Text style={styles.messageDescription}>{description}</Text>
          {context ? (
            <View style={styles.contextContainer}>
              <Text style={styles.contextTitle}>¿Qué podrás hacer aquí?</Text>
              <Text style={styles.contextText}>{context}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#121417",
  },
  placeholder: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  messageCard: {
    backgroundColor: "#FFF7F2",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEE6DA",
    alignItems: "center",
    justifyContent: "center",
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#121417",
    textAlign: "center",
  },
  messageDescription: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
  },
  contextContainer: {
    marginTop: 12,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FCD9C2",
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2410C",
    marginBottom: 4,
  },
  contextText: {
    fontSize: 14,
    color: "#7C2D12",
  },
});

export default SettingsPlaceholder;
