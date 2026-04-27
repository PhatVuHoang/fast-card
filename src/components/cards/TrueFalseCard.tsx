import type { Card } from "@db/schema";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CARD_WIDTH, playSound } from "./shared";

export const TrueFalseCard = ({
  currentCard,
  allCards,
  onAnswer,
}: {
  currentCard: Card;
  allCards: Card[];
  onAnswer: (correct: boolean) => void;
}) => {
  const [displayDefinition, setDisplayDefinition] = useState("");
  const [isCorrectAnswerTrue, setIsCorrectAnswerTrue] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  useEffect(() => {
    // 50% cơ hội hiển thị định nghĩa đúng, 50% hiển thị định nghĩa của thẻ khác
    const shouldShowCorrect = Math.random() > 0.5;
    setIsCorrectAnswerTrue(shouldShowCorrect);

    if (shouldShowCorrect) {
      setDisplayDefinition(currentCard.definition);
    } else {
      const otherCards = allCards.filter((c) => c.id !== currentCard.id);
      const randomCard =
        otherCards[Math.floor(Math.random() * otherCards.length)];
      setDisplayDefinition(randomCard?.definition || "No definition available");
    }
    setSelectedAnswer(null);
  }, [currentCard, allCards]);

  const handleSelect = (answer: boolean) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);

    const isUserCorrect = answer === isCorrectAnswerTrue;
    if (isUserCorrect) playSound(currentCard.term);

    setTimeout(() => onAnswer(isUserCorrect), 800);
  };

  return (
    <View style={{ width: CARD_WIDTH }} className="flex-1 justify-center">
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 mb-8 items-center">
        <Text className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4">
          Term
        </Text>
        <Text className="text-3xl font-black text-slate-800 dark:text-white text-center mb-8">
          {currentCard.term}
        </Text>

        <View className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 mb-8" />

        <Text className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-4">
          Definition
        </Text>
        <Text className="text-xl font-medium text-slate-600 dark:text-slate-300 text-center">
          {displayDefinition}
        </Text>
      </View>

      <View className="flex-row gap-4">
        <TouchableOpacity
          onPress={() => handleSelect(true)}
          className={`flex-1 p-6 rounded-3xl items-center border-2 ${
            selectedAnswer === true
              ? isCorrectAnswerTrue
                ? "bg-green-500 border-green-500"
                : "bg-red-500 border-red-500"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          }`}
        >
          <Text
            className={`font-black text-xl ${selectedAnswer === true ? "text-white" : "text-green-600"}`}
          >
            TRUE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect(false)}
          className={`flex-1 p-6 rounded-3xl items-center border-2 ${
            selectedAnswer === false
              ? !isCorrectAnswerTrue
                ? "bg-green-500 border-green-500"
                : "bg-red-500 border-red-500"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          }`}
        >
          <Text
            className={`font-black text-xl ${selectedAnswer === false ? "text-white" : "text-red-600"}`}
          >
            FALSE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
