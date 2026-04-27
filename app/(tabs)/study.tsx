import { Flashcard } from "@components/Card";
import { db } from "@db/client";
import { cards } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function StudyScreen() {
  const { id, mode } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [allCards, setAllCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ known: 0, learning: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await db
          .select()
          .from(cards)
          .where(eq(cards.deckId, Number(id)));
        setAllCards(result.sort(() => Math.random() - 0.5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const filteredCards = useMemo(() => {
    if (mode === "all") return allCards;
    const now = new Date();
    return allCards.filter((c) => new Date(c.nextReview) <= now);
  }, [allCards, mode]);

  const handleAnswer = async (known: boolean) => {
    const currentCard = filteredCards[currentIndex];
    if (!currentCard) return;

    if (known) {
      setSessionStats((s) => ({ ...s, known: s.known + 1 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSessionStats((s) => ({ ...s, learning: s.learning + 1 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const newLevel = known ? Math.min((currentCard.level || 0) + 1, 5) : 0;
    const daysToAdd = Math.pow(2, newLevel);
    const nextReview = new Date(
      Date.now() + (known ? daysToAdd * 24 * 60 * 60 * 1000 : 0),
    );

    await db
      .update(cards)
      .set({ level: newLevel, nextReview })
      .where(eq(cards.id, currentCard.id));
    setCurrentIndex((prev) => prev + 1);
  };

  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );

  if (filteredCards.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-slate-950 items-center justify-center p-8">
        <Text className="text-6xl mb-6">☕</Text>
        <Text className="text-2xl font-black dark:text-white text-center">
          Thảnh thơi quá Phát ơi!
        </Text>
        <Text className="text-slate-500 text-center mt-4 mb-10 leading-6">
          Bạn đã xử lý hết thẻ cần ôn tập. Hãy nghỉ ngơi để não bộ ghi nhớ tốt
          hơn nhé.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-indigo-600 w-full py-5 rounded-3xl shadow-lg"
        >
          <Text className="text-white text-center font-black text-lg">
            QUAY VỀ TRANG CHỦ
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (currentIndex >= filteredCards.length) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-8">
        <Text className="text-6xl mb-6">🎉</Text>
        <Text className="text-3xl font-black dark:text-white text-center">
          Hoàn thành phiên!
        </Text>
        <View className="flex-row gap-4 my-10 w-full">
          <View className="bg-green-100 dark:bg-green-900/30 p-5 rounded-3xl flex-1 items-center border border-green-200">
            <Text className="text-3xl font-black text-green-700 dark:text-green-400">
              {sessionStats.known}
            </Text>
            <Text className="text-xs font-bold text-green-600 uppercase">
              Know it
            </Text>
          </View>
          <View className="bg-orange-100 dark:bg-orange-900/30 p-5 rounded-3xl flex-1 items-center border border-orange-200">
            <Text className="text-3xl font-black text-orange-700 dark:text-orange-400">
              {sessionStats.learning}
            </Text>
            <Text className="text-xs font-bold text-orange-600 uppercase">
              Learning
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-indigo-600 w-full py-5 rounded-3xl"
        >
          <Text className="text-white text-center font-black text-lg">
            XONG
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-indigo-50 dark:bg-slate-950"
    >
      <View className="px-6 py-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#64748b" />
        </TouchableOpacity>
        <View className="flex-1 mx-6 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500"
            style={{ width: `${(currentIndex / filteredCards.length) * 100}%` }}
          />
        </View>
        <Text className="text-slate-500 font-bold">
          {currentIndex + 1}/{filteredCards.length}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Flashcard
          key={filteredCards[currentIndex].id}
          term={filteredCards[currentIndex].term}
          definition={filteredCards[currentIndex].definition}
          onSwipe={handleAnswer}
        />
      </View>
      <View className="px-6 pb-12 gap-4">
        <TouchableOpacity
          onPress={() => handleAnswer(false)}
          className="bg-white dark:bg-slate-800 border-2 border-orange-100 p-5 rounded-3xl items-center shadow-sm"
        >
          <Text className="text-orange-600 font-black text-lg">
            Still learning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAnswer(true)}
          className="bg-indigo-600 p-5 rounded-3xl items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg">Know it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
