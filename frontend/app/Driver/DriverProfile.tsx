import { userApi } from "@/Services/UserApiService";
import React, { useEffect, useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

export default function DriverProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    profileImage: "",
  });

  const getProfileData = async () => {
    const response = await userApi.getProfile();
    if (response.success && response.data) {
      setUserProfile({
        name: response.data.name,
        email: response.data.institutional_email,
        phone: response.data.phone_number,
        profileImage: response.data.profile_picture,
      });
    } else {
      console.error("Failed to fetch user profile:", response.message);
    }
  };

  useEffect(() => {
    getProfileData();
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChangeProfilePhoto = () => {
    console.log("Cambiar foto de perfil");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de Foto de Perfil */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profilePhotoContainer}
            onPress={handleChangeProfilePhoto}
            activeOpacity={0.8}
          >
            {userProfile.profileImage ? (
              // Si tiene foto de perfil, mostrar la imagen
              <View style={styles.profilePhoto}>
                <Image source={{uri: userProfile.profileImage}} style={styles.profilePhoto} />
              </View>
            ) : (
              // Si no tiene foto, mostrar iniciales
              <View style={styles.profilePhoto}>
                <Text style={styles.profileInitials}>
                  {getInitials(userProfile.name)}
                </Text>
              </View>
            )}

            {/* Indicador de edición */}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* Información del usuario */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userEmail}>{userProfile.email}</Text>
            {userProfile.phone && (
              <Text style={styles.userPhone}>{userProfile.phone}</Text>
            )}
          </View>

          {/* Indicador de conductor */}
          <View style={styles.driverBadge}>
            {/* ua */}
            <Text style={styles.driverBadgeText}>Conductor Verificado</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 11,
    backgroundColor: "#FFFFFF",
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

  // ✅ Nuevos estilos para la sección de perfil
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  profilePhotoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Plus Jakarta Sans",
  },
  photoPlaceholder: {
    fontSize: 40,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F99F7C",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editIcon: {
    fontSize: 16,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "bold",
    fontSize: 24,
    lineHeight: 30,
    color: "#121417",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: "#61758A",
    marginBottom: 2,
  },
  userPhone: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 14,
    lineHeight: 20,
    color: "#61758A",
  },
  driverBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  driverBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  driverBadgeText: {
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 12,
    color: "#2E7D32",
  },
  separator: {
    height: 8,
    backgroundColor: "#F8F9FA",
  },

  // ✅ Estilos para el menú de opciones
  menuSection: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuIcon: {
    fontSize: 24,
    width: 40,
    textAlign: "center",
  },
  menuText: {
    flex: 1,
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "600",
    fontSize: 16,
    color: "#121417",
    marginLeft: 12,
  },
  menuArrow: {
    fontSize: 24,
    color: "#61758A",
    fontWeight: "300",
  },

  // Estilos existentes
  profileButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F99F7C",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 120,
  },
});
