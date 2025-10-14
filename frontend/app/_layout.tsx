import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { AuthProvider } from '../context/UserContext';


export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name='ChooseModeScreen'/>
        <Stack.Screen name="Driver/DriverHomePage"/>
        <Stack.Screen name="Driver/PublishTravel"/>
      </Stack>
    </AuthProvider>
  );
}