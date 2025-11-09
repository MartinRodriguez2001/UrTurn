import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";

export default function LogInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo institucional');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    // Validar formato de email institucional
    const emailRegex = /^[^\s@]+@miuandes\.cl$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email institucional válido (@miuandes.cl)');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando login...');
      console.log('📱 Platform:', Platform.OS);
      console.log('📧 Email:', email.trim().toLowerCase());
      const result = await login(email.trim().toLowerCase(), password.trim());

      console.log('📥 Resultado del login:', result);

      if (result.success) {
        console.log('✅ Login exitoso! Navegando...');
        // Navegar directamente sin mostrar alerta modal
        // Limpiar formulario
        setEmail('');
        setPassword('');
        setRememberMe(false);
        router.replace("/Passenger/PassengerHomePage");
      } else {
        console.log('❌ Error en login:', result.message);
        Alert.alert('Error de Autenticación', result.message || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('❌ Error completo en login:', error);
      
      let errorMessage = 'Error de conexión. ';
      
      if (Platform.OS === 'android') {
        errorMessage += 'Si usas Android Emulator, asegúrate de que el backend esté en http://10.0.2.2:3000';
      } else {
        errorMessage += 'Asegúrate de que el backend esté corriendo en http://localhost:3000';
      }
      
      Alert.alert(
        'Error de Conexión',
        errorMessage + '\n\nVerifica también:\n• Que el backend esté ejecutándose\n• Tus credenciales de acceso'
      );
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
          <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo Institucional (ejemplo@miuandes.cl)"
            placeholderTextColor="#876363"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.helperText}>
            Usa tu correo institucional de UAndes
          </Text>
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
            autoComplete="password"
          />
        </View>

        {/* Forgot Password and Remember Me */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto')}>
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
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
            <Text style={styles.rememberMeText}>Recuérdame</Text>
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>
                  Iniciando sesión...
                </Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerButtonText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>

        {/* Background Design */}
        <View style={styles.backgroundContainer}>
          {/* Background decorative elements */}
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#171212",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 20,
    color: "#61758A",
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
  helperText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    lineHeight: 18,
    color: '#61758A',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  forgotPassword: {
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans",
    color: "#F99F7C",
    lineHeight: 21,
    fontWeight: '500',
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "rgba(29, 27, 32, 0.1)",
    borderWidth: 1,
    borderColor: "#876363",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#F99F7C",
    borderColor: "#F99F7C",
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
    paddingVertical: 8,
  },
  loginButton: {
    backgroundColor: "#F99F7C",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: "transparent",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F5F0F0",
  },
  registerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 21,
    color: "#61758A",
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
});