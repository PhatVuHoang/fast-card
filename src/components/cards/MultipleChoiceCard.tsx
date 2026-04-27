import type { Card } from "@db/schema";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CARD_WIDTH, playSound } from "./shared";

export const MultipleChoiceCard = ({
  currentCard,
  allCards,
  onAnswer,
}: {
  currentCard: Card;
  allCards: Card[];
  onAnswer: (correct: boolean) => void;
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  useEffect(() => {
    const distractors = allCards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((c) => c.term);

    setOptions(
      [...distractors, currentCard.term].sort(() => 0.5 - Math.random()),
    );
    setSelectedOpt(null);
  }, [currentCard, allCards]);

  const handleSelect = (opt: string) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(opt);
    const isCorrect = opt === currentCard.term;
    if (isCorrect) playSound(currentCard.term);
    setTimeout(() => onAnswer(isCorrect), 800);
  };

  return (
    <View style={{ width: CARD_WIDTH }} className="flex-1 justify-center">
      <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 min-h-[200px] justify-center items-center mb-6">
        <Text className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {currentCard.definition}
        </Text>
      </View>
      <View className="gap-3">
        {options.map((opt, i) => {
          const isCorrect = opt === currentCard.term;
          const isSelected = opt === selectedOpt;
          let btnColor =
            "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
          if (selectedOpt) {
            if (isCorrect) btnColor = "bg-green-500 border-green-500";
            else if (isSelected) btnColor = "bg-red-500 border-red-500";
          }
          return (
            <Pressable
              key={i}
              onPress={() => handleSelect(opt)}
              className={`p-4 rounded-2xl border-2 ${btnColor}`}
            >
              <Text
                className={`text-center font-bold text-lg ${selectedOpt && (isCorrect || isSelected) ? "text-white" : "text-slate-700 dark:text-white"}`}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
