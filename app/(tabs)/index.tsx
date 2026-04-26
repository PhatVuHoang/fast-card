import { db, setupDb } from "@db/client";
import { decks } from "@db/schema";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const [allDecks, setAllDecks] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await setupDb();
        const result = await db.select().from(decks);
        setAllDecks(result);
      } catch (error) {
        console.error("Failed to load decks:", error);
      } finally {
        setIsReady(true);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleDeckPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNewDeck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (!isReady) return null;

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-50 to-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
          <View className="flex-row justify-between items-center gap-3">
            <View className="flex-1">
              <Text className="text-4xl font-black text-indigo-950 tracking-tight">
                My Decks
              </Text>
              <Text className="text-indigo-600 text-sm font-medium mt-1">
                {allDecks.length} deck{allDecks.length !== 1 ? "s" : ""} •{" "}
                {allDecks.reduce((sum, d) => sum + (d.cardCount || 0), 0)} cards
              </Text>
            </View>

            <Link href="/import" asChild>
              <TouchableOpacity
                onPress={handleNewDeck}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-5 py-4 rounded-2xl shadow-lg shadow-indigo-200 active:shadow-md active:scale-95 transition-all"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-base">+ New</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator
              size="large"
              color="#4F46E5"
              accessibilityLabel="Loading decks"
            />
            <Text className="text-indigo-600 font-medium mt-3">
              Loading your decks...
            </Text>
          </View>
        ) : allDecks.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">📚</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800 text-center mb-2">
              No Decks Yet
            </Text>
            <Text className="text-slate-600 text-center mb-6 leading-5">
              Create your first deck to start learning with spaced repetition.
            </Text>
            <Link href="/import" asChild>
              <TouchableOpacity
                onPress={handleNewDeck}
                className="bg-gradient-to-r from-green-400 to-green-500 px-8 py-3 rounded-2xl shadow-lg shadow-green-200"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-base">
                  Create First Deck
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          /* Decks List */
          <FlatList
            data={allDecks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Link href={`/study?id=${item.id}`} asChild>
                <TouchableOpacity
                  onPress={handleDeckPress}
                  className="mx-5 mb-4 bg-white rounded-3xl overflow-hidden shadow-md active:shadow-xl active:scale-98 transition-all"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} deck with ${item.cardCount || 0} cards and ${item.masteredCount || 0}% mastery`}
                >
                  <View className="p-6">
                    {/* Card Header */}
                    <View className="flex-row justify-between items-start gap-4 mb-4">
                      <View className="flex-1">
                        <Text className="text-2xl font-black text-indigo-950 mb-1">
                          {item.name}
                        </Text>
                        <Text className="text-indigo-600 text-sm font-semibold">
                          {item.cardCount || 0} cards
                        </Text>
                      </View>

                      {/* Mastery Badge */}
                      <View className="bg-gradient-to-br from-green-50 to-green-100 px-4 py-2 rounded-xl">
                        <Text className="text-green-700 font-black text-lg">
                          {item.masteredCount || 0}%
                        </Text>
                        <Text className="text-green-600 text-xs font-medium">
                          Mastery
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-1">
                      <View className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <View
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                          style={{
                            width: `${Math.max(item.masteredCount || 0, 5)}%`,
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 font-medium text-right">
                      {Math.round(item.masteredCount || 0)}% of cards mastered
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollIndicatorInsets={{ right: 1 }}
            accessibilityLabel="List of study decks"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
