import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/authContext";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institutionCredential, setInstitutionCredential] = useState("");
  const [studentCertificate, setStudentCertificate] = useState("");
  const [isDriver, setIsDriver] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSignUp = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre");
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert("Error", "El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email institucional");
      return;
    }

    // Validar formato de email institucional
    const emailRegex = /^[^\s@]+@miuandes\.cl$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Error",
        "Por favor ingresa un email institucional válido (@miuandes.cl)"
      );
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Por favor ingresa tu número de teléfono");
      return;
    }

    // Validar formato de teléfono
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phoneNumber.trim()) || phoneNumber.trim().length < 8) {
      Alert.alert(
        "Error",
        "Por favor ingresa un número de teléfono válido (mínimo 8 dígitos)"
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Por favor ingresa una contraseña");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Validar que la contraseña tenga al menos un número
    if (!/\d/.test(password)) {
      Alert.alert("Error", "La contraseña debe contener al menos un número");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      console.log("✅ Validaciones pasadas, navegando a siguiente pantalla...");
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push({
        pathname: "/profilePictureRegister",
        params: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phoneNumber: phoneNumber.trim(),
          description: description.trim() || "",
        },
      });
      setName("");
      setEmail("");
      setPhoneNumber("");
      setDescription("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error("❌ Error al navegar:", error);
      Alert.alert("Error", "Hubo un problema al continuar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={22} color="#121417" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign Up</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#876363"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Institutional Email"
              placeholderTextColor="#876363"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (ej: +56912345678)"
              placeholderTextColor="#876363"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (Ej: Estudiante de 3er año, Conductor con 5 años de experiencia)"
              placeholderTextColor="#876363"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Opcional: Cuéntanos un poco sobre ti
            </Text>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#876363"
              value={password}
              onChangeText={setPassword}
              
            />
            <Text style={styles.helperText}>
              Mínimo 6 caracteres y debe contener al menos un número
            </Text>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#876363"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              
            />
          </View>

          {/* Upload University ID Button */}
          {/* <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload University ID</Text>
            </TouchableOpacity>
          </View> */}

          {/* Terms and Privacy Policy */}
          {/* <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View> */}
        </View>

        {/* Sign Up Button */}
        <View style={styles.bottomContainer}>
          <View style={styles.signUpButtonContainer}>
            <TouchableOpacity
              style={[
                styles.signUpButton,
                loading && styles.signUpButtonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.spacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 844,
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
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
    height: 23,
    alignItems: "center",
    paddingRight: 48, // Offset for back button
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    backgroundColor: "#F5F0F0",
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Plus Jakarta Sans",
    color: "#171212",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  helperText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    lineHeight: 18,
    color: "#61758A",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  uploadContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  uploadButton: {
    backgroundColor: "#F5F0F0",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 21,
    color: "#876363",
    textAlign: "center",
  },
  termsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: "center",
  },
  termsText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
    textAlign: "center",
  },
  bottomContainer: {
    paddingBottom: 100,
  },
  signUpButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  signUpButton: {
    backgroundColor: "#F99F7C",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  signUpButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textAlign: "center",
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  spacer: {
    height: 20,
    backgroundColor: "#FFFFFF",
  },
});
