import { db } from "@db/client";
import type { Deck } from "@db/schema";
import { cards, decks } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq, sql } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Link, useFocusEffect } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DeckWithStats = Deck & { cardCount: number; masteredCount: number };

export default function Home() {
  const [allDecks, setAllDecks] = useState<DeckWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const fetchDecks = useCallback(async () => {
    try {
      const result = await db
        .select({
          id: decks.id,
          name: decks.name,
          description: decks.description,
          createdAt: decks.createdAt,
          cardCount: sql<number>`COUNT(${cards.id})`.mapWith(Number),
          masteredCount: sql<number>`
            ROUND(
              COALESCE(
                SUM(CASE WHEN ${cards.level} >= 2 THEN 1.0 WHEN ${cards.level} = 1 THEN 0.5 ELSE 0 END) * 100.0 / NULLIF(COUNT(${cards.id}), 0),
                0
              )
            )
          `.mapWith(Number),
        })
        .from(decks)
        .leftJoin(cards, eq(decks.id, cards.deckId))
        .groupBy(decks.id);
      setAllDecks(result as DeckWithStats[]);
    } catch (error) {
      console.error("Failed to load decks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDecks();
    }, [fetchDecks]),
  );

  return (
    <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-slate-950">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-6 flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-4xl font-black text-indigo-950 dark:text-white tracking-tight">
              My Decks
            </Text>
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1">
              {allDecks.length} decks •{" "}
              {allDecks.reduce((sum, d) => sum + (d.cardCount || 0), 0)} cards
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setColorScheme(isDark ? "light" : "dark");
              }}
              className="bg-indigo-100 dark:bg-slate-800 p-3 rounded-full"
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={20}
                color="#4F46E5"
              />
            </TouchableOpacity>

            <Link href="/import" asChild>
              <TouchableOpacity className="bg-indigo-600 px-5 py-4 rounded-2xl active:scale-95 shadow-sm">
                <Text className="text-white font-bold text-base">+ New</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : allDecks.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">📚</Text>
            </View>
            <Text className="text-2xl font-black text-slate-800 dark:text-slate-100 text-center mb-6">
              No Decks Yet
            </Text>
            <Link href="/import" asChild>
              <TouchableOpacity className="bg-indigo-600 px-8 py-4 rounded-2xl shadow-md">
                <Text className="text-white font-bold">Create First Deck</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <FlatList
            data={allDecks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Link
                href={{ pathname: "/deck/[id]", params: { id: item.id } }}
                asChild
              >
                <TouchableOpacity className="mx-5 mb-4 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm active:scale-98">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-2xl font-black text-indigo-950 dark:text-white"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                        {item.cardCount} cards
                      </Text>
                    </View>
                    <View className="bg-green-50 dark:bg-green-950 px-3 py-2 rounded-xl">
                      <Text className="text-green-700 dark:text-green-400 font-black text-lg">
                        {item.masteredCount}%
                      </Text>
                    </View>
                  </View>
                  <View className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-green-400"
                      style={{ width: `${item.masteredCount}%` }}
                    />
                  </View>
                </TouchableOpacity>
              </Link>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
