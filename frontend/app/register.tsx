import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/UserContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSignUp = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      console.log('Intentando registrar usuario...', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'passenger'
      });

      const result = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'passenger',
      });

      console.log('Resultado del registro:', result);

      if (result.success) {
        console.log('✅ Registro exitoso! Navegando...');
        // Navegar directamente sin Alert
        router.replace('/ChooseModeScreen');
      } else {
        console.log('❌ Error en registro:', result.message);
        Alert.alert('Error', result.message || 'No se pudo registrar el usuario');
      }
    } catch (error) {
      console.error('Error completo en registro:', error);
      Alert.alert(
        'Error de conexión', 
        'No se pudo conectar con el servidor. Verifica:\n\n' +
        '1. Que el backend esté corriendo\n' +
        '2. La URL en services/api.ts\n' +
        '3. Si usas Android Emulator: http://10.0.2.2:3000'
      );
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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
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

          {/* RUT Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="RUT"
              placeholderTextColor="#876363"
              value={rut}
              onChangeText={setRut}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#876363"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#876363"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          {/* Upload University ID Button */}
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload University ID</Text>
            </TouchableOpacity>
          </View>

          {/* Terms and Privacy Policy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>

        {/* Sign Up Button */}
        <View style={styles.bottomContainer}>
          <View style={styles.signUpButtonContainer}>
            <TouchableOpacity 
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: 844,
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
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
    height: 23,
    alignItems: 'center',
    paddingRight: 48, // Offset for back button
  },
  title: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 23,
    color: '#121417',
    textAlign: 'center',
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
    backgroundColor: '#F5F0F0',
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Plus Jakarta Sans',
    color: '#171212',
  },
  uploadContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  uploadButton: {
    backgroundColor: '#F5F0F0',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 21,
    color: '#876363',
    textAlign: 'center',
  },
  termsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
  },
  termsText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    lineHeight: 21,
    color: '#61758A',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingBottom: 100,
  },
  signUpButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  signUpButton: {
    backgroundColor: '#F99F7C',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  signUpButtonText: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  spacer: {
    height: 20,
    backgroundColor: '#FFFFFF',
  },
});