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

  const handleAddCard = async () => {
    if (!newTerm.trim() || !newDef.trim()) return;
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
  };

  const handleDeleteDeck = () => {
    Alert.alert("Xóa bộ thẻ", `Bạn có chắc muốn xóa "${deckName}"?`, [
      { text: "Hủy" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await db.delete(decks).where(eq(decks.id, Number(id)));
          router.replace("/");
        },
      },
    ]);
  };

  const dueCardsCount = deckCards.filter(
    (c) => new Date(c.nextReview) <= new Date(),
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Ionicons name="chevron-back" size={28} color="#4F46E5" />
        </TouchableOpacity>
        <Text
          className="text-xl font-black dark:text-white flex-1 ml-4"
          numberOfLines={1}
        >
          {deckName}
        </Text>
        <TouchableOpacity onPress={handleDeleteDeck}>
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
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
            <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-6 shadow-sm border border-indigo-50">
              <TextInput
                placeholder="Từ mới"
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-2 dark:text-white"
                value={newTerm}
                onChangeText={setNewTerm}
              />
              <TextInput
                placeholder="Định nghĩa"
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4 dark:text-white"
                value={newDef}
                onChangeText={setNewDef}
              />
              <TouchableOpacity
                onPress={handleAddCard}
                className="bg-indigo-600 p-4 rounded-2xl items-center shadow-sm"
              >
                <Text className="text-white font-bold">Thêm thẻ</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
              <View className="flex-1">
                <Text className="font-bold dark:text-white text-base">
                  {item.term}
                </Text>
                <Text className="text-slate-500 text-sm">
                  {item.definition}
                </Text>
              </View>
              <View className="bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-indigo-600">
                  LVL {item.level}
                </Text>
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>

      <View className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push(`/study?id=${id}&mode=due`)}
          className={`flex-1 py-4 rounded-2xl items-center ${dueCardsCount > 0 ? "bg-indigo-100 dark:bg-indigo-950" : "bg-slate-100 dark:bg-slate-800 opacity-50"}`}
          disabled={dueCardsCount === 0}
        >
          <Text
            className={`font-bold ${dueCardsCount > 0 ? "text-indigo-600" : "text-slate-400"}`}
          >
            Ôn tập ({dueCardsCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/study?id=${id}&mode=all`)}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center shadow-lg"
        >
          <Text className="text-white font-bold">Học tất cả</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
