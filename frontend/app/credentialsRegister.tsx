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

export default function CredentialRegister() {
  const router = useRouter();
  const { register } = useAuth();
  
  // Recibir datos de la pantalla anterior (profilePictureRegister)
  const { name, email, password, phoneNumber, description, profilePicture } = useLocalSearchParams();
  
  const [institutionCredential, setInstitutionCredential] = useState<string | null>(null);
  const [studentCertificate, setStudentCertificate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectInstitutionCredential = async () => {
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

  const takePhoto = async (type: 'credential' | 'certificate') => {
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
        if (type === 'credential') {
          setInstitutionCredential(result.assets[0].uri);
        } else {
          setStudentCertificate(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error(`Error al tomar foto del ${type}:`, error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const pickImage = async (type: 'credential' | 'certificate') => {
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
        if (type === 'credential') {
          setInstitutionCredential(result.assets[0].uri);
        } else {
          setStudentCertificate(result.assets[0].uri);
        }
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
        if (type === 'credential') {
          setInstitutionCredential(result.assets[0].uri);
        } else {
          setStudentCertificate(result.assets[0].uri);
        }
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
        [
          {
            text: 'Continuar',
            onPress: () => {
              router.replace('/ChooseModeScreen');
            }
          }
        ]
      );
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
    return uri.includes('.jpg') || uri.includes('.jpeg') || uri.includes('.png') || uri.includes('.gif');
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
            <Text style={styles.title}>Documentos</Text>
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
            <Text style={styles.documentTitle}>📋 Credencial Institucional</Text>
            <Text style={styles.documentDescription}>
              Sube una foto clara de tu credencial universitaria o carnet estudiantil
            </Text>
            
            {institutionCredential ? (
              <View style={styles.documentPreview}>
                {isImage(institutionCredential) ? (
                  <Image source={{ uri: institutionCredential }} style={styles.documentImage} />
                ) : (
                  <View style={styles.documentFile}>
                    <Text style={styles.documentFileIcon}>📄</Text>
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
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Adjuntar Credencial</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Student Certificate Section */}
          <View style={styles.documentSection}>
            <Text style={styles.documentTitle}>🎓 Certificado de Alumno Regular</Text>
            <Text style={styles.documentDescription}>
              Sube tu certificado de alumno regular vigente (puede ser PDF o imagen)
            </Text>
            
            {studentCertificate ? (
              <View style={styles.documentPreview}>
                {isImage(studentCertificate) ? (
                  <Image source={{ uri: studentCertificate }} style={styles.documentImage} />
                ) : (
                  <View style={styles.documentFile}>
                    <Text style={styles.documentFileIcon}>📄</Text>
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
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Adjuntar Certificado</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>💡 Consejos importantes:</Text>
            <Text style={styles.instructionText}>• Los documentos deben estar vigentes</Text>
            <Text style={styles.instructionText}>• Las fotos deben ser claras y legibles</Text>
            <Text style={styles.instructionText}>• Puedes usar PDF para el certificado</Text>
            <Text style={styles.instructionText}>• La verificación puede tomar 24-48 horas</Text>
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
    height: 23,
    alignItems: "center",
    paddingRight: 48,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 23,
    color: "#121417",
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
    padding: 16,
    borderRadius: 12,
  },
  documentTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 18,
    color: "#121417",
    marginBottom: 8,
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F99F7C",
    borderStyle: "dashed",
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  documentFileIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  documentFileName: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#2E86AB",
    fontWeight: "500",
  },
  changeDocumentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F0F0",
    borderRadius: 20,
  },
  changeDocumentText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#876363",
    fontWeight: "500",
  },
  instructionsContainer: {
    backgroundColor: "#FFF8E1",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "bold",
    color: "#121417",
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: "#F99F7C",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  continueButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFFFFF",
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