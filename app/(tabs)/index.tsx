import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq, sql } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const [allDecks, setAllDecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setIsLoading(true);
        const result = await db
          .select({
            id: decks.id,
            name: decks.name,
            cardCount: sql<number>`COUNT(${cards.id})`.mapWith(Number),
            masteredCount: sql<number>`
              ROUND(
                COALESCE(
                  SUM(CASE WHEN ${cards.level} >= 5 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(${cards.id}), 0),
                  0
                )
              )
            `.mapWith(Number),
          })
          .from(decks)
          .leftJoin(cards, eq(decks.id, cards.deckId))
          .groupBy(decks.id);
        setAllDecks(result);
      } catch (error) {
        console.error("Failed to load decks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDecks();
  }, []);

  const handleDeckPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/study?id=${id}`);
  };

  const handleNewDeck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
          <View className="flex-row justify-between items-center gap-3">
            <View className="flex-1">
              <Text className="text-4xl font-black text-indigo-950 dark:text-white tracking-tight">
                My Decks
              </Text>
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1">
                {allDecks.length} deck{allDecks.length !== 1 ? "s" : ""} •{" "}
                {allDecks.reduce((sum, d) => sum + (d.cardCount || 0), 0)} cards
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              {/* Dark Mode Toggle */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setColorScheme(isDark ? "light" : "dark");
                }}
                className="bg-indigo-100 dark:bg-slate-800 p-3 rounded-full"
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${isDark ? "light" : "dark"} mode`}
              >
                <Ionicons
                  name={isDark ? "sunny" : "moon"}
                  size={20}
                  color={isDark ? "#818CF8" : "#4F46E5"}
                />
              </TouchableOpacity>

              {/* New Deck Button */}
              <Link href="/import" asChild>
                <TouchableOpacity
                  onPress={handleNewDeck}
                  className="bg-indigo-600 dark:bg-indigo-500 px-5 py-4 rounded-2xl active:scale-95"
                  style={{
                    elevation: 3,
                    shadowColor: "#4F46E5",
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base">+ New</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator
              size="large"
              color={isDark ? "#818CF8" : "#4F46E5"}
              accessibilityLabel="Loading decks"
            />
            <Text className="text-indigo-600 dark:text-indigo-400 font-medium mt-3">
              Loading your decks...
            </Text>
          </View>
        ) : allDecks.length === 0 ? (
          /* Empty State */
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">📚</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 text-center mb-2">
              No Decks Yet
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-center mb-6 leading-5">
              Create your first deck to start learning with spaced repetition.
            </Text>
            <Link href="/import" asChild>
              <TouchableOpacity
                onPress={handleNewDeck}
                className="bg-gradient-to-r from-green-400 to-green-500 px-8 py-3 rounded-2xl"
                activeOpacity={0.8}
                style={{
                  elevation: 3,
                  shadowColor: "#4ade80",
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 2 },
                }}
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
              <Link
                href={{
                  pathname: "/deck/[id]",
                  params: { id: item.id },
                }}
                asChild
              >
                <TouchableOpacity
                  onPress={() => handleDeckPress(item.id)}
                  className="mx-5 mb-4 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden active:scale-98"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} deck with ${item.cardCount || 0} cards and ${item.masteredCount || 0}% mastery`}
                  style={{
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <View className="p-6">
                    {/* Card Header */}
                    <View className="flex-row justify-between items-start gap-4 mb-4">
                      <View className="flex-1">
                        <Text className="text-2xl font-black text-indigo-950 dark:text-white mb-1">
                          {item.name}
                        </Text>
                        <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                          {item.cardCount || 0} cards
                        </Text>
                      </View>

                      {/* Mastery Badge */}
                      <View className="bg-green-50 dark:bg-green-950 px-4 py-2 rounded-xl">
                        <Text className="text-green-700 dark:text-green-400 font-black text-lg">
                          {item.masteredCount || 0}%
                        </Text>
                        <Text className="text-green-600 dark:text-green-500 text-xs font-medium">
                          Mastery
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-1">
                      <View className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <View
                          className="h-full bg-green-400 dark:bg-green-500 rounded-full"
                          style={{
                            width: `${Math.max(item.masteredCount || 0, 5)}%`,
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium text-right">
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
