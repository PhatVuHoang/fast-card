import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const deckId = Number(id);

  const [deck, setDeck] = useState<any>(null);
  const [deckCards, setDeckCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [importText, setImportText] = useState("");

  const loadData = async () => {
    try {
      const deckResult = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
      });
      const cardsResult = await db
        .select()
        .from(cards)
        .where(eq(cards.deckId, deckId));

      if (deckResult) setDeck(deckResult);
      setDeckCards(cardsResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreateCard = async () => {
    if (!term.trim() || !definition.trim()) return;
    try {
      await db.insert(cards).values({
        deckId: deckId,
        term: term.trim(),
        definition: definition.trim(),
        level: 0,
        nextReview: new Date(),
      });
      setTerm("");
      setDefinition("");
      setAddModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to create card");
    }
  };

  const handleFastImport = async () => {
    if (!importText.trim()) return;

    const lines = importText.split("\n");
    const newCards = [];

    for (const line of lines) {
      const parts = line.split(/\s*-\s*|\t/);
      if (parts.length >= 2) {
        const parsedTerm = parts[0].trim();
        const parsedDef = parts.slice(1).join(" - ").trim();

        if (parsedTerm && parsedDef) {
          newCards.push({
            deckId: deckId,
            term: parsedTerm,
            definition: parsedDef,
            level: 0,
            nextReview: new Date(),
          });
        }
      }
    }

    if (newCards.length > 0) {
      try {
        await db.insert(cards).values(newCards);
        setImportText("");
        setImportModalVisible(false);
        loadData();
      } catch (error) {
        Alert.alert("Error", "Failed to import cards");
      }
    } else {
      Alert.alert(
        "Invalid Format",
        "Please follow the format: Term - Definition on each line.",
      );
    }
  };

  const handleDeleteDeck = async () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete Deck",
      "Are you sure you want to delete this deck and all its cards?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await db.delete(decks).where(eq(decks.id, deckId));
            router.replace("/");
          },
        },
      ],
    );
  };

  const handleDeleteCard = async (cardId: number) => {
    Alert.alert("Delete Card", "Do you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db.delete(cards).where(eq(cards.id, cardId));
          setDeckCards((prev) => prev.filter((c) => c.id !== cardId));
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-6 py-4 flex-row items-center justify-between bg-white dark:bg-slate-950">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>

        <Text className="text-lg font-black text-slate-900 dark:text-white">
          Deck Details
        </Text>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="p-2 -mr-2"
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={menuVisible}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View className="bg-white dark:bg-slate-900 p-8 rounded-t-[40px] shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                setAddModalVisible(true);
              }}
              className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-3"
            >
              <View className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl mr-4">
                <Ionicons name="add-circle" size={24} color="#4F46E5" />
              </View>
              <Text className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                Add Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                setImportModalVisible(true);
              }}
              className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-3"
            >
              <View className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl mr-4">
                <Ionicons name="clipboard" size={24} color="#10B981" />
              </View>
              <View>
                <Text className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  Fast Import
                </Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  Paste multiple cards
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteDeck}
              className="flex-row items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl mb-6"
            >
              <View className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl mr-4">
                <Ionicons name="trash" size={24} color="#ef4444" />
              </View>
              <Text className="font-bold text-red-500 text-lg">
                Delete Deck
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              className="w-full py-4 items-center"
            >
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white dark:bg-slate-900 w-full p-8 rounded-[40px] shadow-2xl">
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-6">
              New Card
            </Text>

            <TextInput
              placeholder="Term"
              placeholderTextColor="#94a3b8"
              value={term}
              onChangeText={setTerm}
              autoFocus
              className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl mb-4 text-slate-900 dark:text-white font-bold"
            />

            <TextInput
              placeholder="Definition"
              placeholderTextColor="#94a3b8"
              value={definition}
              onChangeText={setDefinition}
              multiline
              className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl mb-6 text-slate-900 dark:text-white font-bold min-h-[100px]"
            />

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl items-center"
              >
                <Text className="text-slate-500 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateCard}
                className="flex-1 bg-indigo-600 p-5 rounded-2xl items-center shadow-lg shadow-indigo-200"
              >
                <Text className="text-white font-black">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={importModalVisible}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white dark:bg-slate-900 w-full p-8 rounded-[40px] shadow-2xl">
            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Fast Import
            </Text>
            <Text className="text-slate-500 font-bold text-xs mb-6 uppercase tracking-widest">
              Format: Term - Definition
            </Text>

            <TextInput
              placeholder="Apple - A fruit&#10;Car - A vehicle"
              placeholderTextColor="#94a3b8"
              value={importText}
              onChangeText={setImportText}
              multiline
              textAlignVertical="top"
              autoFocus
              className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl mb-6 text-slate-900 dark:text-white font-bold h-48"
            />

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setImportModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl items-center"
              >
                <Text className="text-slate-500 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFastImport}
                className="flex-1 bg-green-500 p-5 rounded-2xl items-center shadow-lg shadow-green-200"
              >
                <Text className="text-white font-black">Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={deckCards}
        keyExtractor={(item) => item.id.toString()}
        extraData={deck}
        ListHeaderComponent={() => (
          <View className="px-6 py-4">
            <View className="bg-indigo-600 p-8 rounded-[40px] shadow-xl mb-8">
              <Text className="text-white text-3xl font-black mb-2">
                {deck?.name || "Untitled Deck"}
              </Text>
              <Text className="text-indigo-100 font-bold opacity-80">
                {deckCards.length} cards in total
              </Text>
            </View>

            <Text className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4 ml-2">
              Learning Modes
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/study", params: { id } })
              }
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl flex-row items-center border border-slate-100 dark:border-slate-800 mb-4 shadow-sm"
            >
              <View className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl mr-4">
                <Ionicons name="book" size={24} color="#4F46E5" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-slate-900 dark:text-white text-lg">
                  Study
                </Text>
                <Text className="text-slate-500 text-sm">Personalized SRS</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: "/test", params: { id } })}
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl flex-row items-center border border-slate-100 dark:border-slate-800 mb-8 shadow-sm"
            >
              <View className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl mr-4">
                <Ionicons name="clipboard" size={24} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="font-black text-slate-900 dark:text-white text-lg">
                  Test
                </Text>
                <Text className="text-slate-500 text-sm">Mixed formats</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <Text className="text-slate-400 font-black text-xs uppercase tracking-widest mb-4 ml-2">
              Cards list
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="mx-6 mb-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text className="font-bold text-slate-900 dark:text-white text-lg">
                {item.term}
              </Text>
              <Text className="text-slate-500 mt-1">{item.definition}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteCard(item.id)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={<View className="h-10" />}
      />
    </SafeAreaView>
  );
}
