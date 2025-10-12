import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  TextInput,
} from "react-native";
import { useState } from "react";

export default function PublishTravel() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

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
          <Text style={styles.headerTitle}>Publicar viaje</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Route Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Detalles de viaje</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Precio"
                placeholderTextColor="#876363"
                value={origin}
                onChangeText={setOrigin}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Vehiculo"
                placeholderTextColor="#876363"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* Date and Time Section */}
          <View style={styles.sectionContainer}>
            <TextInput
              style={styles.input}
              placeholder="Origen"
              placeholderTextColor="#876363"
              value={date}
              onChangeText={setDate}
            />

            <TextInput
              style={styles.input}
              placeholder="Destino"
              placeholderTextColor="#876363"
              value={time}
              onChangeText={setTime}
            />
          </View>

          {/* Trip Details Section */}
          <View style={styles.sectionContainer}> 
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <TextInput
                  style={styles.input}
                  placeholder="Hora de partida"
                  placeholderTextColor="#876363"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Asientos disponibles"
                placeholderTextColor="#876363"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {/* Publish Button */}
      <View style={styles.publishButtonContainer}>
        <TouchableOpacity style={styles.publishButton}>
          <Text style={styles.publishButtonText}>Publicar Viaje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
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
  headerTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    flex: 1,
    paddingTop: 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 24,
    color: "#121417",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  originIcon: {
    fontSize: 16,
  },
  destinationIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F0F0",
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#121417",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    paddingTop: 16,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#121417",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 100,
  },
  publishButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  publishButton: {
    backgroundColor: "#F99F7C",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  publishButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
  },
});
