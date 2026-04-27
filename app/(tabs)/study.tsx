import { Flashcard, MultipleChoiceCard, WrittenCard } from "@components/cards";
import { db } from "@db/client";
import type { Card } from "@db/schema";
import { cards } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function StudyScreen() {
  const { id, mode } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [allDeckCards, setAllDeckCards] = useState<Card[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [totalInitialCards, setTotalInitialCards] = useState(0);
  const [sessionStats, setSessionStats] = useState({ known: 0, learning: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await db
          .select()
          .from(cards)
          .where(eq(cards.deckId, Number(id)));

        setAllDeckCards(result);

        const now = new Date();
        let initialCards =
          mode === "all"
            ? result
            : result.filter((c) => new Date(c.nextReview!) <= now);

        initialCards = initialCards.sort(() => Math.random() - 0.5);

        setQueue(initialCards);
        setTotalInitialCards(initialCards.length);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, mode]);

  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      if (queue.length === 0) return;

      const currentCard = queue[0];
      const currentLevel = currentCard.level ?? 0;

      const newLevel = isCorrect ? Math.min(currentLevel + 1, 5) : 0;
      const daysToAdd = Math.pow(2, newLevel);
      const nextReview = new Date(
        Date.now() + (isCorrect ? daysToAdd * 24 * 60 * 60 * 1000 : 0),
      );

      db.update(cards)
        .set({ level: newLevel, nextReview })
        .where(eq(cards.id, currentCard.id))
        .catch(console.error);

      if (currentCard.level !== -1) {
        if (isCorrect) setSessionStats((s) => ({ ...s, known: s.known + 1 }));
        else setSessionStats((s) => ({ ...s, learning: s.learning + 1 }));
      }

      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        newQueue.shift();

        if (!isCorrect) {
          newQueue.push({ ...currentCard, level: 0, _isRetry: true } as any);
        }
        return newQueue;
      });
    },
    [queue],
  );

  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-indigo-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );

  if (totalInitialCards === 0) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-50 dark:bg-slate-950 items-center justify-center p-8">
        <Text className="text-6xl mb-6">☕</Text>
        <Text className="text-2xl font-black dark:text-white text-center">
          All caught up!
        </Text>
        <Text className="text-slate-500 text-center mt-4 mb-10 leading-6">
          You've reviewed all due cards. Take a break — your brain is hard at
          work!
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-indigo-600 w-full py-5 rounded-3xl shadow-lg"
        >
          <Text className="text-white text-center font-black text-lg">
            GO HOME
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (queue.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-8">
        <Text className="text-6xl mb-6">🎉</Text>
        <Text className="text-3xl font-black dark:text-white text-center">
          Session Complete!
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
            DONE
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentCard = queue[0];
  const cardLevel = currentCard.level ?? 0;

  const completedCards = Math.max(
    0,
    totalInitialCards - queue.filter((c: any) => !c._isRetry).length,
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            style={{ width: `${(completedCards / totalInitialCards) * 100}%` }}
          />
        </View>
        <View className="items-end">
          <Text className="text-slate-500 font-bold text-xs uppercase">
            Lv. {cardLevel}
          </Text>
          <Text className="text-slate-500 font-bold">
            {completedCards}/{totalInitialCards}
          </Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {cardLevel === 0 && (
          <Flashcard
            key={currentCard.id + "-lvl0"}
            term={currentCard.term}
            definition={currentCard.definition}
            onSwipe={handleAnswer}
          />
        )}

        {(cardLevel === 1 || cardLevel === 2) && (
          <MultipleChoiceCard
            key={currentCard.id + "-lvl12"}
            currentCard={currentCard}
            allCards={allDeckCards}
            onAnswer={handleAnswer}
          />
        )}

        {cardLevel >= 3 && (
          <WrittenCard
            key={currentCard.id + "-lvl345"}
            currentCard={currentCard}
            onAnswer={handleAnswer}
          />
        )}
      </View>

      {cardLevel === 0 && (
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
      )}
    </KeyboardAvoidingView>
  );
}
