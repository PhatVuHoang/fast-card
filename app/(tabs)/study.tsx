import { Flashcard } from "@components/Card";
import { db } from "@db/client";
import { cards } from "@db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// THÊM: Dùng Hook insets thay vì SafeAreaView để không bị crash
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Lấy chiều cao của Status Bar/Tai thỏ

  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const loadCards = async () => {
      try {
        const result = await db
          .select()
          .from(cards)
          .where(eq(cards.deckId, Number(id)));
        setQueue(result.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Failed to load cards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCards();
  }, [id]);

  const currentCard = queue[currentIndex];
  const progressPercentage =
    queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

  const handleAnswer = async (known: boolean) => {
    if (!currentCard || isAnswering) return;
    setIsAnswering(true);
    try {
      if (known) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newLevel = Math.min((currentCard.level || 0) + 1, 5);
        const daysToAdd = Math.pow(2, newLevel);
        await db
          .update(cards)
          .set({
            level: newLevel,
            nextReview: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000),
          })
          .where(eq(cards.id, currentCard.id));
        setCompletedCount((prev) => prev + 1);
        nextCard();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await db
          .update(cards)
          .set({ level: 0, nextReview: new Date() })
          .where(eq(cards.id, currentCard.id));
        const reorderedQueue = [...queue];
        const [missedCard] = reorderedQueue.splice(currentIndex, 1);
        setQueue([...reorderedQueue, missedCard]);
      }
    } catch (error) {
      console.error("Failed to update card:", error);
    } finally {
      setIsAnswering(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(-1);
    }
  };

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-indigo-50 dark:bg-slate-950"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color={isDark ? "#818CF8" : "#4F46E5"}
          />
          <Text className="text-indigo-600 dark:text-indigo-400 font-medium mt-3">
            Loading cards...
          </Text>
        </View>
      </View>
    );
  }

  if (
    currentIndex === -1 ||
    (queue.length > 0 && completedCount === queue.length)
  ) {
    return (
      <View
        className="flex-1 bg-green-50 dark:bg-slate-950"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ScrollView
          // Đưa alignItems và justifyContent vào đúng chỗ của nó
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
          // Chỉ giữ lại flex-1 và padding cho lớp bên ngoài
          className="flex-1 px-6"
        >
          <View
            className="w-24 h-24 bg-green-400 rounded-full items-center justify-center mb-6"
            style={{
              elevation: 5,
              shadowColor: "#4ade80",
              shadowOpacity: 0.3,
              shadowRadius: 5,
            }}
          >
            <Text className="text-5xl">🎉</Text>
          </View>
          <Text className="text-4xl font-black text-green-950 dark:text-green-100 text-center mb-2">
            Excellent!
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-center mt-2 leading-6 mb-4">
            You've completed all {queue.length} cards in this deck. Great
            progress!
          </Text>
          <View
            className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 mb-8"
            style={{
              elevation: 3,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 3,
            }}
          >
            <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">
              Session Summary
            </Text>
            <View className="flex-row justify-between gap-4">
              <View className="flex-1 bg-green-50 dark:bg-green-950 rounded-2xl p-4 items-center">
                <Text className="text-2xl font-black text-green-600 dark:text-green-400">
                  {completedCount}
                </Text>
                <Text className="text-xs text-green-600 dark:text-green-500 font-medium mt-1">
                  Mastered
                </Text>
              </View>
              <View className="flex-1 bg-blue-50 dark:bg-blue-950 rounded-2xl p-4 items-center">
                <Text className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {queue.length}
                </Text>
                <Text className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">
                  Total Cards
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            className="w-full bg-indigo-500 px-8 py-4 rounded-2xl items-center"
            style={{
              elevation: 3,
              shadowColor: "#4F46E5",
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Back to Decks</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (!currentCard) return null;

  return (
    <View
      className="flex-1 bg-white dark:bg-slate-950"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="px-6 pt-4 pb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 self-start"
        >
          <Text className="text-2xl dark:text-white">←</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            PROGRESS
          </Text>
          <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {completedCount}/{queue.length}
          </Text>
        </View>
        <View className="h-3 w-full bg-indigo-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Flashcard
          key={currentCard.id}
          term={currentCard.term}
          definition={currentCard.definition}
        />
        <Text className="text-slate-500 dark:text-slate-400 mt-8 text-sm font-medium">
          Tap the card to reveal answer
        </Text>
      </View>

      <View className="px-6 pb-8 gap-3 mt-10">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleAnswer(false);
          }}
          disabled={isAnswering}
          className="flex-row items-center justify-center bg-white dark:bg-slate-800 border-2 border-orange-200 dark:border-orange-900 p-5 rounded-3xl active:scale-95"
          style={{
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-xl mr-2">🔄</Text>
          <Text className="text-orange-600 dark:text-orange-400 font-bold text-base">
            Learn Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleAnswer(true);
          }}
          disabled={isAnswering}
          className="flex-row items-center justify-center bg-green-500 p-5 rounded-3xl active:scale-95"
          style={{
            elevation: 3,
            shadowColor: "#4ade80",
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }}
          activeOpacity={0.8}
        >
          {isAnswering ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text className="text-xl mr-2">✓</Text>
              <Text className="text-white font-bold text-base">Mastered</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
