import { Stack } from "expo-router";
import { AppDataProvider } from "../context/AppDataContext";

export default function RootLayout() {
  return (
    <AppDataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="home" />
        {/* keep any other Stack.Screen entries you already have here,
            e.g. stylist, wardrobe, profile, upload, tryon, wishlist */}
      </Stack>
    </AppDataProvider>
  );
}
