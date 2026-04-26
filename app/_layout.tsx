import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import "@/global.css";
import { db, expoDb } from "@db/client";

// --- DRIZZLE ORM DATABASE IMPORTS ---
import migrations from "@/drizzle/migrations";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Sửa thành đường dẫn Alias gốc để tránh lỗi Cannot resolve module
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  const { success, error } = useMigrations(db, migrations);

  useDrizzleStudio(expoDb);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text className="text-red-500 font-bold mb-2">
          Lỗi khởi tạo Database:
        </Text>
        <Text className="text-center px-4">{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text className="font-semibold text-lg">
          Đang thiết lập Database...
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="import" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
