import { Flashcard } from "@components/Card";
import { db } from "@db/client";
import { cards } from "@db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);

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
        // Provide positive haptic feedback
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
        // Provide warning haptic feedback
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

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-50 to-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-indigo-600 font-medium mt-3">
            Loading cards...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Completion State
  if (
    currentIndex === -1 ||
    (queue.length > 0 && completedCount === queue.length)
  ) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-green-50 to-white">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="flex-1 items-center justify-center px-6"
        >
          <View className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full items-center justify-center mb-6 shadow-lg shadow-green-200">
            <Text className="text-5xl">🎉</Text>
          </View>

          <Text className="text-4xl font-black text-green-950 text-center mb-2">
            Excellent!
          </Text>

          <Text className="text-slate-600 text-center mt-2 leading-6 mb-4">
            You've completed all {queue.length} cards in this deck. Great
            progress!
          </Text>

          <View className="w-full bg-white rounded-3xl p-6 shadow-md mb-8">
            <Text className="text-sm font-semibold text-slate-600 mb-4">
              Session Summary
            </Text>
            <View className="flex-row justify-between gap-4">
              <View className="flex-1 bg-green-50 rounded-2xl p-4 items-center">
                <Text className="text-2xl font-black text-green-600">
                  {completedCount}
                </Text>
                <Text className="text-xs text-green-600 font-medium mt-1">
                  Mastered
                </Text>
              </View>
              <View className="flex-1 bg-blue-50 rounded-2xl p-4 items-center">
                <Text className="text-2xl font-black text-blue-600">
                  {queue.length}
                </Text>
                <Text className="text-xs text-blue-600 font-medium mt-1">
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
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 px-8 py-4 rounded-2xl items-center shadow-lg shadow-indigo-200"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Back to Decks</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Study Screen
  if (!currentCard) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-50 to-white">
      {/* Header with Progress */}
      <View className="px-6 pt-4 pb-6">
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 self-start"
          accessibilityLabel="Close study session"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>

        {/* Progress Info */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-indigo-600">PROGRESS</Text>
          <Text className="text-sm font-bold text-indigo-600">
            {completedCount}/{queue.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-3 w-full bg-indigo-100 rounded-full overflow-hidden shadow-inner">
          <View
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      {/* Flashcard */}
      <View className="flex-1 items-center justify-center px-6">
        <Flashcard
          key={currentCard.id}
          term={currentCard.term}
          definition={currentCard.definition}
        />
        <Text className="text-slate-500 mt-8 text-sm font-medium">
          Tap the card to reveal answer
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-8 gap-3">
        {/* Not Mastered Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleAnswer(false);
          }}
          disabled={isAnswering}
          className="flex-row items-center justify-center bg-white border-2 border-orange-200 p-5 rounded-3xl shadow-md active:scale-95 transition-all"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Not mastered - will review later"
          accessibilityState={{ disabled: isAnswering }}
        >
          <Text className="text-xl mr-2">🔄</Text>
          <Text className="text-orange-600 font-bold text-base">
            Learn Again
          </Text>
        </TouchableOpacity>

        {/* Mastered Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleAnswer(true);
          }}
          disabled={isAnswering}
          className="flex-row items-center justify-center bg-gradient-to-r from-green-400 to-green-500 p-5 rounded-3xl shadow-lg shadow-green-200 active:scale-95 transition-all"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Mastered - continue to next card"
          accessibilityState={{ disabled: isAnswering }}
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
    </SafeAreaView>
  );
}
