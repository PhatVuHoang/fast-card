import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [deckCards, setDeckCards] = useState<any[]>([]);
  const [deckName, setDeckName] = useState("");

  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");

  const loadData = async () => {
    const deckInfo = await db
      .select()
      .from(decks)
      .where(eq(decks.id, Number(id)));
    if (deckInfo[0]) setDeckName(deckInfo[0].name);

    const result = await db
      .select()
      .from(cards)
      .where(eq(cards.deckId, Number(id)));
    setDeckCards(result);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/");
  };

  const handleAddCard = async () => {
    if (!newTerm.trim() || !newDef.trim()) return;

    try {
      await db.insert(cards).values({
        deckId: Number(id),
        term: newTerm.trim(),
        definition: newDef.trim(),
        nextReview: new Date(),
      });

      setNewTerm("");
      setNewDef("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (err) {
      console.error("Thêm thẻ thất bại:", err);
    }
  };

  const deleteCard = async (cardId: number) => {
    Alert.alert("Xác nhận", "Xóa thẻ này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await db.delete(cards).where(eq(cards.id, cardId));
          loadData();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color="#4F46E5" />
        </TouchableOpacity>
        <Text
          className="text-xl font-black text-slate-800 dark:text-white flex-1 ml-2"
          numberOfLines={1}
        >
          {deckName}
        </Text>
        <TouchableOpacity onPress={() => router.push(`/study?id=${id}`)}>
          <Text className="text-indigo-600 font-bold">HỌC</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={deckCards}
          keyExtractor={(item) => item.id.toString()}
          className="px-4 pt-4"
          ListHeaderComponent={
            <View className="bg-white dark:bg-slate-900 p-4 rounded-3xl mb-6 shadow-sm border border-indigo-100 dark:border-indigo-900">
              <Text className="text-sm font-bold text-indigo-600 mb-3">
                THÊM THẺ NHANH
              </Text>
              <TextInput
                placeholder="Từ vựng (Ví dụ: React)"
                className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2 dark:text-white"
                value={newTerm}
                onChangeText={setNewTerm}
              />
              <TextInput
                placeholder="Nghĩa của từ"
                className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-3 dark:text-white"
                value={newDef}
                onChangeText={setNewDef}
              />
              <TouchableOpacity
                onPress={handleAddCard}
                className="bg-indigo-600 p-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Thêm vào bộ thẻ</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
              <View className="flex-1">
                <Text className="font-bold text-slate-800 dark:text-white">
                  {item.term}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm">
                  {item.definition}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteCard(item.id)}
                className="p-2"
              >
                <Ionicons name="trash-outline" size={20} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
