import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfilePictureRegister() {
  const router = useRouter();
  const { name, email, password, phoneNumber, description } = useLocalSearchParams();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para seleccionar imagen desde galería
  const pickImageFromGallery = async () => {
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
        aspect: [1, 1], // Cuadrado
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para tomar foto con cámara
  const takePhoto = async () => {
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
        aspect: [1, 1], // Cuadrado
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Función para mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción para tu foto de perfil',
      [
        {
          text: 'Cámara',
          onPress: takePhoto,
        },
        {
          text: 'Galería',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  // Función para completar el registro
  const handleContinueToCredentials = async (profilePictureUri: string) => {
  setLoading(true);

  try {
    console.log('🔄 Pasando a credenciales...');
    console.log('📧 Email:', email);
    console.log('📱 Phone:', phoneNumber);
    console.log('🖼️ Profile Picture URI:', profilePictureUri);

    // Simular un pequeño delay para mostrar el loading
    await new Promise(resolve => setTimeout(resolve, 500));

    // Navegar a credentialsRegister con todos los datos
    router.push({
      pathname: "/credentialsRegister",
      params: {
        name: name as string,
        email: email as string,
        password: password as string,
        phoneNumber: phoneNumber as string,
        description: (description as string) || '',
        profilePicture: profilePictureUri, // URI de la imagen o string vacío
      },
    });

  } catch (error) {
    console.error('❌ Error al navegar:', error);
    Alert.alert('Error', 'Hubo un problema al continuar. Intenta de nuevo.');
  } finally {
    setLoading(false);
  }
};

// Función para continuar sin foto
const skipPhoto = async () => {
  await handleContinueToCredentials('');
};

// Función para continuar con foto
const continueWithPhoto = async () => {
  if (!imageUri) {
    Alert.alert('Error', 'Por favor selecciona una foto primero');
    return;
  }
  
  await handleContinueToCredentials(imageUri);
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
            <Text style={styles.title}>Upload Picture</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>¡Hola {name}!</Text>
            <Text style={styles.subtitleText}>
              Agrega una foto de perfil para que otros usuarios puedan reconocerte
            </Text>
          </View>

          {/* Profile Picture Section */}
          <View style={styles.imageContainer}>
            {imageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={showImageOptions}
                >
                  <Text style={styles.changeImageText}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.placeholderContainer}
                onPress={showImageOptions}
              >
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderIcon}>📷</Text>
                  <Text style={styles.placeholderText}>Toca para agregar foto</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Consejos para tu foto:</Text>
            <Text style={styles.instructionText}>• Usa una foto clara y reciente</Text>
            <Text style={styles.instructionText}>• Asegúrate de que tu rostro sea visible</Text>
            <Text style={styles.instructionText}>• Evita usar filtros o efectos</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {imageUri ? (
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={continueWithPhoto}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>
                    Completando registro...
                  </Text>
                </View>
              ) : (
                <Text style={styles.continueButtonText}>Continuar</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={showImageOptions}
            >
              <Text style={styles.addPhotoButtonText}>Agregar Foto</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.skipButton, loading && styles.buttonDisabled]}
            onPress={skipPhoto}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>
              {loading ? 'Procesando...' : 'Omitir por ahora'}
            </Text>
          </TouchableOpacity>
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
    marginBottom: 40,
  },
  greetingText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 24,
    lineHeight: 30,
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
  imageContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  imageWrapper: {
    alignItems: "center",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 16,
  },
  changeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F0F0",
    borderRadius: 20,
  },
  changeImageText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#876363",
    fontWeight: "500",
  },
  placeholderContainer: {
    alignItems: "center",
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F5F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F99F7C",
    borderStyle: "dashed",
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#876363",
    textAlign: "center",
    fontWeight: "500",
  },
  instructionsContainer: {
    backgroundColor: "#F8F9FA",
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
  addPhotoButton: {
    backgroundColor: "#F99F7C",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  addPhotoButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  skipButton: {
    backgroundColor: "transparent",
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5F0F0",
  },
  skipButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    color: "#61758A",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});