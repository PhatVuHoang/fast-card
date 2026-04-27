import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AddMode = null | "menu" | "single" | "bulk";

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [deckCards, setDeckCards] = useState<any[]>([]);
  const [deckName, setDeckName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Modal state
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [bulkContent, setBulkContent] = useState("");

  const loadData = async () => {
    try {
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const closeModal = () => {
    setAddMode(null);
    setNewTerm("");
    setNewDef("");
    setBulkContent("");
  };

  const handleAddCard = async () => {
    if (!newTerm.trim() || !newDef.trim()) return;
    setIsAdding(true);
    try {
      await db.insert(cards).values({
        deckId: Number(id),
        term: newTerm.trim(),
        definition: newDef.trim(),
        nextReview: new Date(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
      loadData();
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkContent.trim()) return;
    setIsAdding(true);
    try {
      const cardData = bulkContent
        .split("\n")
        .map((line) => {
          const sep = line.indexOf(" - ");
          if (sep === -1) return null;
          return {
            deckId: Number(id),
            term: line.slice(0, sep).trim(),
            definition: line.slice(sep + 3).trim(),
            nextReview: new Date(),
          };
        })
        .filter(
          (c): c is NonNullable<typeof c> =>
            c !== null && !!c.term && !!c.definition,
        );

      if (cardData.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "No valid cards",
          "Use the format: front - back\nOne card per line.",
        );
        return;
      }

      await db.insert(cards).values(cardData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
      loadData();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCard = (cardId: number, term: string) => {
    Alert.alert("Delete Card", `Delete "${term}"?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await db.delete(cards).where(eq(cards.id, cardId));
          loadData();
        },
      },
    ]);
  };

  const handleDeleteDeck = () => {
    Alert.alert(
      "Delete Deck",
      `Are you sure you want to delete "${deckName}"?`,
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await db.delete(decks).where(eq(decks.id, Number(id)));
            router.replace("/");
          },
        },
      ],
    );
  };

  const dueCardsCount = deckCards.filter(
    (c) => new Date(c.nextReview) <= new Date(),
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.replace("/")}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={28} color="#4F46E5" />
        </TouchableOpacity>
        <Text
          className="text-xl font-black dark:text-white flex-1 ml-4"
          numberOfLines={1}
        >
          {deckName}
        </Text>
        <TouchableOpacity
          onPress={handleDeleteDeck}
          accessibilityLabel="Delete deck"
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Card List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={deckCards}
          keyExtractor={(item) => item.id.toString()}
          className="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">🃏</Text>
              <Text className="text-slate-500 dark:text-slate-400 font-semibold text-center">
                No cards yet. Tap + to add some!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-3 flex-row items-center shadow-sm">
              <View className="flex-1 mr-3">
                <Text className="font-bold dark:text-white text-base">
                  {item.term}
                </Text>
                <Text className="text-slate-500 text-sm mt-0.5">
                  {item.definition}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                  <Text className="text-[10px] font-bold text-indigo-600">
                    LVL {item.level}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteCard(item.id, item.term)}
                  className="p-2"
                  accessibilityLabel={`Delete card ${item.term}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Study Buttons */}
      <View className="px-6 pt-4 pb-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push(`/study?id=${id}&mode=due`)}
          className={`flex-1 py-4 rounded-2xl items-center ${dueCardsCount > 0 ? "bg-indigo-100 dark:bg-indigo-950" : "bg-slate-100 dark:bg-slate-800 opacity-50"}`}
          disabled={dueCardsCount === 0}
          accessibilityLabel={`Review ${dueCardsCount} due cards`}
          accessibilityRole="button"
        >
          <Text
            className={`font-bold ${dueCardsCount > 0 ? "text-indigo-600" : "text-slate-400"}`}
          >
            Review ({dueCardsCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/study?id=${id}&mode=all`)}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center shadow-lg"
          accessibilityLabel="Study all cards"
          accessibilityRole="button"
        >
          <Text className="text-white font-bold">Study All</Text>
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setAddMode("menu");
        }}
        className="absolute bottom-36 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
        accessibilityLabel="Add cards"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Card Modal */}
      <Modal
        visible={addMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Scrim */}
          <TouchableOpacity
            className="flex-1 bg-black/40"
            activeOpacity={1}
            onPress={closeModal}
          />

          {/* Sheet */}
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl px-6 pt-4 pb-10">
            {/* Handle */}
            <View className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full self-center mb-6" />

            {/* ── Menu ── */}
            {addMode === "menu" && (
              <>
                <Text className="text-xl font-black text-indigo-950 dark:text-white mb-6">
                  Add Cards
                </Text>

                <TouchableOpacity
                  onPress={() => setAddMode("single")}
                  className="bg-indigo-50 dark:bg-indigo-950 rounded-2xl p-5 mb-3 flex-row items-center gap-4"
                  accessibilityRole="button"
                >
                  <View className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center">
                    <Ionicons name="create-outline" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-indigo-950 dark:text-white text-base">
                      Add a Card
                    </Text>
                    <Text className="text-slate-500 text-sm mt-0.5">
                      Enter word and definition manually
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAddMode("bulk")}
                  className="bg-indigo-50 dark:bg-indigo-950 rounded-2xl p-5 flex-row items-center gap-4"
                  accessibilityRole="button"
                >
                  <View className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center">
                    <Ionicons name="list-outline" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-indigo-950 dark:text-white text-base">
                      Bulk Import
                    </Text>
                    <Text className="text-slate-500 text-sm mt-0.5">
                      Paste cards as "front - back"
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </>
            )}

            {/* ── Single Card Form ── */}
            {addMode === "single" && (
              <>
                <View className="flex-row items-center mb-6">
                  <TouchableOpacity
                    onPress={() => setAddMode("menu")}
                    className="mr-3"
                    accessibilityLabel="Back"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={22} color="#4F46E5" />
                  </TouchableOpacity>
                  <Text className="text-xl font-black text-indigo-950 dark:text-white">
                    Add a Card
                  </Text>
                </View>

                <TextInput
                  placeholder="Word or phrase"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 dark:text-white text-slate-800 p-4 rounded-2xl mb-3 text-base font-medium"
                  value={newTerm}
                  onChangeText={setNewTerm}
                  accessibilityLabel="Term input"
                  returnKeyType="next"
                  autoFocus
                />
                <TextInput
                  placeholder="Definition"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 dark:text-white text-slate-800 p-4 rounded-2xl mb-5 text-base font-medium"
                  value={newDef}
                  onChangeText={setNewDef}
                  accessibilityLabel="Definition input"
                  returnKeyType="done"
                  onSubmitEditing={handleAddCard}
                />
                <TouchableOpacity
                  onPress={handleAddCard}
                  disabled={isAdding}
                  className="bg-indigo-600 p-5 rounded-2xl items-center"
                  style={{ opacity: isAdding ? 0.7 : 1 }}
                  accessibilityRole="button"
                >
                  {isAdding ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black text-base">
                      Add Card
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ── Bulk Import Form ── */}
            {addMode === "bulk" && (
              <>
                <View className="flex-row items-center mb-4">
                  <TouchableOpacity
                    onPress={() => setAddMode("menu")}
                    className="mr-3"
                    accessibilityLabel="Back"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={22} color="#4F46E5" />
                  </TouchableOpacity>
                  <Text className="text-xl font-black text-indigo-950 dark:text-white">
                    Bulk Import
                  </Text>
                </View>

                <Text className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  One card per line · Format: front - back
                </Text>
                <TextInput
                  placeholder={"hello - a friendly greeting\nworld - the earth"}
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="bg-slate-50 dark:bg-slate-800 dark:text-white text-slate-800 p-4 rounded-2xl mb-5 text-base"
                  textAlignVertical="top"
                  style={{ minHeight: 140 }}
                  value={bulkContent}
                  onChangeText={setBulkContent}
                  accessibilityLabel="Bulk import input"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleBulkImport}
                  disabled={isAdding}
                  className="bg-indigo-600 p-5 rounded-2xl items-center"
                  style={{ opacity: isAdding ? 0.7 : 1 }}
                  accessibilityRole="button"
                >
                  {isAdding ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black text-base">
                      Import Cards
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
