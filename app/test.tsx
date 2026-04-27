import {
  MultipleChoiceCard,
  TrueFalseCard,
  WrittenCard,
} from "@components/cards";
import { db } from "@db/client";
import { cards, type Card } from "@db/schema";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type QuestionFormat = "mcq" | "written" | "true_false";

interface Question {
  card: Card;
  format: QuestionFormat;
}

export default function TestScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ card: Card; isCorrect: boolean }[]>(
    [],
  );

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    setIsLoading(true);
    try {
      const deckId = Number(id);
      const deckCards = await db
        .select()
        .from(cards)
        .where(eq(cards.deckId, deckId));

      setAllCards(deckCards);

      const shuffledCards = [...deckCards]
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);

      const testQuestions: Question[] = shuffledCards.map((card) => {
        const rand = Math.random();
        let format: QuestionFormat = "mcq";
        if (rand > 0.66) format = "written";
        else if (rand > 0.33) format = "true_false";

        return { card, format };
      });

      setQuestions(testQuestions);
      setCurrentIndex(0);
      setResults([]);
    } catch (error) {
      console.error("Failed to load test:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setResults((prev) => [
      ...prev,
      { card: questions[currentIndex].card, isCorrect },
    ]);
    setCurrentIndex((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  if (currentIndex >= questions.length && questions.length > 0) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 p-8 items-center justify-center">
        <Text className="text-slate-400 font-black uppercase tracking-widest mb-2">
          Your Score
        </Text>
        <Text className="text-7xl font-black text-indigo-600 dark:text-indigo-400 mb-8">
          {score}%
        </Text>

        <View className="flex-row gap-4 mb-12">
          <View className="flex-1 bg-green-50 dark:bg-green-900/20 p-6 rounded-[32px] items-center border border-green-100 dark:border-green-900/30">
            <Text className="text-3xl font-black text-green-600">
              {correctCount}
            </Text>
            <Text className="text-green-600/60 font-bold text-xs uppercase">
              Correct
            </Text>
          </View>
          <View className="flex-1 bg-red-50 dark:bg-red-900/20 p-6 rounded-[32px] items-center border border-red-100 dark:border-red-900/30">
            <Text className="text-3xl font-black text-red-600">
              {questions.length - correctCount}
            </Text>
            <Text className="text-red-600/60 font-bold text-xs uppercase">
              Mistakes
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={loadTest}
          className="bg-indigo-600 w-full py-5 rounded-3xl items-center mb-4 shadow-lg shadow-indigo-200"
        >
          <Text className="text-white font-black text-lg uppercase">
            Retake Test
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-full py-5 rounded-3xl items-center"
        >
          <Text className="text-slate-400 font-bold uppercase">
            Back to Deck
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />

        <View className="px-6 py-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#64748b" />
          </TouchableOpacity>
          <View className="flex-1 mx-6 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-500"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </View>
          <Text className="text-slate-500 font-bold">
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          {currentQuestion.format === "mcq" && (
            <MultipleChoiceCard
              key={`mcq-${currentQuestion.card.id}`}
              currentCard={currentQuestion.card}
              allCards={allCards}
              onAnswer={handleAnswer}
            />
          )}
          {currentQuestion.format === "written" && (
            <WrittenCard
              key={`written-${currentQuestion.card.id}`}
              currentCard={currentQuestion.card}
              onAnswer={handleAnswer}
            />
          )}
          {currentQuestion.format === "true_false" && (
            <TrueFalseCard
              key={`tf-${currentQuestion.card.id}`}
              currentCard={currentQuestion.card}
              allCards={allCards}
              onAnswer={handleAnswer}
            />
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
