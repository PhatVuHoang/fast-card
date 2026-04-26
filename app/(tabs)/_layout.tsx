import "@/global.css";
import { expoDb } from "@db/client";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";

export default function RootLayout() {
  useDrizzleStudio(expoDb);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="study" options={{ presentation: "modal" }} />
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
    </Stack>
  );
}
