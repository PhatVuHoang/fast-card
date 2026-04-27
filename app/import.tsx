import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ImportScreen() {
  const [deckName, setDeckName] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImport = async () => {
    if (!deckName.trim() || !content.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert("Missing info", "Please fill in both fields.");
    }

    setIsLoading(true);
    try {
      const newDeck = await db
        .insert(decks)
        .values({ name: deckName.trim() })
        .returning();
      const deckId = newDeck[0].id;

      const lines = content.split("\n");
      const cardData = lines
        .map((line) => {
          const [term, def] = line.split(/[-:]/);
          return {
            deckId,
            term: term?.trim(),
            definition: def?.trim(),
            nextReview: new Date(),
          };
        })
        .filter((c) => c.term && c.definition);

      await db.insert(cards).values(cardData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Done!",
        `Imported ${cardData.length} cards into ${deckName}`,
      );
      router.replace("/");
    } catch (err) {
      console.error(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not import cards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white dark:bg-slate-800 p-2 rounded-full"
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-indigo-950 dark:text-white">
          New Deck
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6 pb-6"
      >
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm mb-4">
          <Text className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
            Deck Name
          </Text>
          <TextInput
            placeholder="e.g. IELTS Topic 1"
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl text-base font-medium text-slate-800"
            value={deckName}
            onChangeText={setDeckName}
            accessibilityLabel="Deck name input"
            returnKeyType="next"
          />
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm flex-1 mb-4">
          <Text className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">
            Cards
          </Text>
          <TextInput
            placeholder={
              "Paste content here:\nword - definition\nOne card per line"
            }
            placeholderTextColor="#94a3b8"
            multiline
            className="bg-slate-50 dark:bg-slate-800 dark:text-white p-4 rounded-2xl flex-1 text-base"
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            accessibilityLabel="Card content input"
          />
        </View>

        <TouchableOpacity
          onPress={handleImport}
          disabled={isLoading}
          className="bg-indigo-600 p-5 rounded-3xl items-center shadow-lg active:scale-95"
          accessibilityLabel="Import deck"
          accessibilityRole="button"
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-lg">
              Bắt đầu nạp thẻ 🚀
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
