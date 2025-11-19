import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from '../context/authContext';

const MAX_FILE_BYTES = 4 * 1024 * 1024;

const convertUriToBase64 = async (uri: string): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size > MAX_FILE_BYTES) {
      Alert.alert('Archivo muy grande', 'Selecciona un archivo de hasta 4 MB.');
      return null;
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo archivo a base64:', error);
    Alert.alert('Error', 'No se pudo procesar el archivo seleccionado.');
    return null;
  }
};

export default function CredentialRegister() {
  const router = useRouter();
  const { register } = useAuth();
  const isWeb = Platform.OS === 'web';
  
  // Recibir datos de la pantalla anterior (profilePictureRegister)
  const { name, email, password, phoneNumber, description, profilePicture } = useLocalSearchParams();
  
  const [institutionCredential, setInstitutionCredential] = useState<string | null>(null);
  const [studentCertificate, setStudentCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectInstitutionCredential = async () => {
    if (isWeb) {
      await pickDocument('credential');
      return;
    }

    Alert.alert(
      'Credencial Institucional',
      'Selecciona tu credencial institucional',
      [
        {
          text: 'Tomar Foto',
          onPress: () => takePhoto('credential'),
        },
        {
          text: 'Seleccionar de Galería',
          onPress: () => pickImage('credential'),
        },
        {
          text: 'Seleccionar Documento',
          onPress: () => pickDocument('credential'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  // Función para seleccionar certificado de alumno regular
  const selectStudentCertificate = async () => {
    if (isWeb) {
      await pickDocument('certificate');
      return;
    }

    Alert.alert(
      'Certificado de Alumno Regular',
      'Selecciona tu certificado de alumno regular',
      [
        {
          text: 'Tomar Foto',
          onPress: () => takePhoto('certificate'),
        },
        {
          text: 'Seleccionar de Galería',
          onPress: () => pickImage('certificate'),
        },
        {
          text: 'Seleccionar Documento',
          onPress: () => pickDocument('certificate'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const setDocumentValue = async (type: 'credential' | 'certificate', uri: string) => {
    if (isWeb) {
      const base64 = await convertUriToBase64(uri);
      if (!base64) {
        return;
      }
      if (type === 'credential') {
        setInstitutionCredential(base64);
      } else {
        setStudentCertificate(base64);
      }
    } else {
      if (type === 'credential') {
        setInstitutionCredential(uri);
      } else {
        setStudentCertificate(uri);
      }
    }
  };

  const takePhoto = async (type: 'credential' | 'certificate') => {
    if (isWeb) {
      await pickDocument(type);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tu cámara.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await setDocumentValue(type, result.assets[0].uri);
      }
    } catch (error) {
      console.error(`Error al tomar foto del ${type}:`, error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickImage = async (type: 'credential' | 'certificate') => {
    if (isWeb) {
      await pickDocument(type);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tu galería de fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await setDocumentValue(type, result.assets[0].uri);
      }
    } catch (error) {
      console.error(`Error al seleccionar imagen del ${type}:`, error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para seleccionar documento
  const pickDocument = async (type: 'credential' | 'certificate') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await setDocumentValue(type, result.assets[0].uri);
      }
    } catch (error) {
      console.error(`Error al seleccionar documento del ${type}:`, error);
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const handleContinue = async () => {
  if (!institutionCredential || !studentCertificate) {
    Alert.alert(
      'Documentos requeridos',
      'Por favor adjunta tanto tu credencial institucional como tu certificado de alumno regular para continuar.'
    );
    return;
  }

  setLoading(true);

  try {
    console.log('🔄 Completando registro con todos los datos...');
    console.log('📧 Email:', email);
    console.log('📱 Phone:', phoneNumber);
    console.log('🖼️ Profile Picture:', profilePicture);
    console.log('📋 Institution Credential:', institutionCredential);
    console.log('🎓 Student Certificate:', studentCertificate);

    const userData = {
      name: name as string,
      email: email as string,
      password: password as string,
      phone_number: phoneNumber as string,
      description: (description as string) || '',
      profile_picture: (profilePicture as string) || '',
      institution_credential: institutionCredential,
      student_certificate: studentCertificate,
      IsDriver: false,
    };

    console.log('📤 Datos de registro completos:', userData);

    const result = await register(userData);

    console.log('📥 Resultado del registro:', result);

    if (result.success) {
      console.log('✅ Registro completado exitosamente! Navegando...');
      
      Alert.alert(
        'Registro Exitoso',
        '¡Bienvenido a UrTurn! Tu cuenta ha sido creada correctamente. Tus documentos serán verificados en las próximas 24-48 horas.',
      );

      router.replace('/ChooseModeScreen');
    } else {
      console.log('❌ Error en registro:', result.message);
      Alert.alert('Error de Registro', result.message || 'No se pudo completar el registro');
    }
  } catch (error) {
    console.error('❌ Error completo en registro:', error);
    
    let errorMessage = 'Error de conexión. ';
    
    if (Platform.OS === 'android') {
      errorMessage += 'Si usas Android Emulator, asegúrate de que el backend esté en http://10.0.2.2:3000';
    } else {
      errorMessage += 'Asegúrate de que el backend esté corriendo en http://localhost:3000';
    }
    
    Alert.alert(
      'Error de Conexión',
      errorMessage + '\n\nVerifica también:\n• Que el backend esté ejecutándose\n• La configuración de red'
    );
  } finally {
    setLoading(false);
  }
};

  const isImage = (uri: string) => {
    if (!uri) {
      return false;
    }
    if (uri.startsWith('data:image/')) {
      return true;
    }
    return /\.(jpg|jpeg|png|gif)$/i.test(uri);
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
            <Text style={styles.title}>Verificación de Documentos</Text>
            <Text style={styles.subtitle}>Confirma tu identidad estudiantil</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Verificación de Documentos</Text>
            <Text style={styles.subtitleText}>
              Para garantizar la seguridad de nuestra comunidad, necesitamos verificar tu identidad estudiantil
            </Text>
          </View>

          {/* Institution Credential Section */}
          <View style={styles.documentSection}>
            <View style={styles.documentTitleContainer}>
              <Feather name="credit-card" size={20} color="#F99F7C" />
              <Text style={styles.documentTitle}>Credencial Institucional</Text>
            </View>
            <Text style={styles.documentDescription}>
              Sube una foto clara de tu credencial universitaria o carnet estudiantil
            </Text>
            
            {institutionCredential ? (
              <View style={styles.documentPreview}>
                {isImage(institutionCredential) ? (
                  <Image source={{ uri: institutionCredential }} style={styles.documentImage} />
                ) : (
                  <View style={styles.documentFile}>
                    <Feather name="file-text" size={32} color="#2E86AB" />
                    <Text style={styles.documentFileName}>Documento adjuntado</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.changeDocumentButton}
                  onPress={() => selectInstitutionCredential()}
                >
                  <Text style={styles.changeDocumentText}>Cambiar documento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={selectInstitutionCredential}
              >
                <Feather name="upload" size={32} color="#FFFFFF" />
                <Text style={styles.uploadText}>Adjuntar Credencial</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Student Certificate Section */}
          <View style={styles.documentSection}>
            <View style={styles.documentTitleContainer}>
              <Feather name="award" size={20} color="#F99F7C" />
              <Text style={styles.documentTitle}>Certificado de Alumno Regular</Text>
            </View>
            <Text style={styles.documentDescription}>
              Sube tu certificado de alumno regular vigente (puede ser PDF o imagen)
            </Text>
            
            {studentCertificate ? (
              <View style={styles.documentPreview}>
                {isImage(studentCertificate) ? (
                  <Image source={{ uri: studentCertificate }} style={styles.documentImage} />
                ) : (
                  <View style={styles.documentFile}>
                    <Feather name="file-text" size={32} color="#2E86AB" />
                    <Text style={styles.documentFileName}>Documento adjuntado</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.changeDocumentButton}
                  onPress={() => selectStudentCertificate()}
                >
                  <Text style={styles.changeDocumentText}>Cambiar documento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={selectStudentCertificate}
              >
                <Feather name="upload" size={32} color="#FFFFFF" />
                <Text style={styles.uploadText}>Adjuntar Certificado</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsTitleContainer}>
              <Feather name="info" size={20} color="#F59E0B" />
              <Text style={styles.instructionsTitle}>Consejos importantes:</Text>
            </View>
            <View style={styles.instructionItem}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.instructionText}>Los documentos deben estar vigentes</Text>
            </View>
            <View style={styles.instructionItem}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.instructionText}>Las fotos deben ser claras y legibles</Text>
            </View>
            <View style={styles.instructionItem}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.instructionText}>Puedes usar PDF para el certificado</Text>
            </View>
            <View style={styles.instructionItem}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.instructionText}>La verificación puede tomar 24-48 horas</Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!institutionCredential || !studentCertificate || loading) && styles.buttonDisabled
            ]}
            onPress={handleContinue}
            disabled={!institutionCredential || !studentCertificate || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>
                  Completando registro...
                </Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>Crear Cuenta</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.verificationNote}>
            Tus documentos serán verificados por nuestro equipo de seguridad
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... resto de los estilos permanecen igual ...
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
    alignItems: "center",
    paddingRight: 48,
    paddingVertical: 8,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 25,
    color: "#121417",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 13,
    lineHeight: 16,
    color: "#876363",
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  greetingText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 22,
    lineHeight: 28,
    color: "#121417",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#61758A",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  documentSection: {
    marginBottom: 24,
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  documentTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    color: "#121417",
    marginLeft: 8,
  },
  documentDescription: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: "#F99F7C",
    height: 100,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#F99F7C",
    borderStyle: "dashed",
    elevation: 2,
    shadowColor: "#F99F7C",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  documentPreview: {
    alignItems: "center",
  },
  documentImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  documentFile: {
    width: "100%",
    height: 100,
    backgroundColor: "#E8F4FD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  documentFileName: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "600",
    marginTop: 8,
  },
  changeDocumentButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F8F9FA",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  changeDocumentText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  instructionsContainer: {
    backgroundColor: "#FEF3C7",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  instructionsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400E",
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: "#F99F7C",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#F99F7C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  continueButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationNote: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 12,
    color: "#61758A",
    textAlign: "center",
    marginTop: 8,
  },
});
