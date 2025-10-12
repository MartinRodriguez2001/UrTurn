import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';


export function RootLayout() {
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='ChooseModeScreen'/>
        <Stack.Screen name="Driver/DriverHomePage"/>
        <Stack.Screen name="Driver/PublishTravel"/>
      </Stack>
  );
}

export function AuthStack() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
      <Stack.Screen name="register"/>
    </Stack>
  )
}