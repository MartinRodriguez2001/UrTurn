import { Image } from "expo-image";
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
  View,
} from "react-native";
import { useAuth } from "../context/UserContext";

export default function LogInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.success) {
        console.log('✅ Login exitoso! Navegando...');
        router.replace("/ChooseModeScreen");
      } else {
        Alert.alert('Error', result.message || 'Credenciales inválidas');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Verifica que el servidor esté corriendo.');
      console.error('Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/573a134073f02eabf4b2d4a083eedc5d4c522c32.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Viaja Seguro</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo Institucional"
            placeholderTextColor="#876363"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#876363"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Forgot Password and Remember Me */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Olvidaste tu contaseña?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>Recuerdame</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar sesion</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerButtonText}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Background Design */}
        <View style={styles.backgroundContainer}>
          {/* Background decorative elements will be added later */}
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
    paddingHorizontal: 16,
    minHeight: 844,
  },
  logoContainer: {
    height: 89,
    width: 285,
    marginTop: 50,
    alignSelf: "center",
  },
  logo: {
    width: 269,
    height: 65,
  },
  titleContainer: {
    height: 60,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#171212",
    textAlign: "center",
  },
  inputContainer: {
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
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
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans",
    color: "#876363",
    lineHeight: 21,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 2,
    backgroundColor: "rgba(29, 27, 32, 0.1)",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#6750A4",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans",
    color: "#876363",
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: "#F99F7C",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loginButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    textAlign: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  registerButton: {
    backgroundColor: "#F5F0F0",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  registerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#171212",
    textAlign: "center",
  },
  backgroundContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: -1,
  },
  backgroundVector: {
    width: "100%",
    height: "100%",
  },
});
