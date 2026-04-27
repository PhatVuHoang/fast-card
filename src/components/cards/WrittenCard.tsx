import type { Card } from "@db/schema";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { CARD_WIDTH, playSound } from "./shared";

export const WrittenCard = ({
  currentCard,
  onAnswer,
}: {
  currentCard: Card;
  onAnswer: (correct: boolean) => void;
}) => {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");

  const handleSubmit = () => {
    if (!input.trim() || status !== "idle") return;

    Keyboard.dismiss();

    const isCorrect =
      input.trim().toLowerCase() === currentCard.term.toLowerCase();
    setStatus(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      playSound(currentCard.term);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      onAnswer(isCorrect);
      setInput("");
      setStatus("idle");
    }, 1200);
  };

  const hasInput = input.trim().length > 0;

  return (
    <View style={{ width: CARD_WIDTH }} className="flex-1 justify-center">
      <View className="bg-indigo-600 rounded-3xl p-6 shadow-xl min-h-[200px] justify-center items-center mb-6">
        <Pressable
          onPress={() => playSound(currentCard.definition)}
          className="absolute top-4 right-4 p-2 bg-indigo-500 rounded-full z-50"
        >
          <MaterialCommunityIcons name="volume-high" size={16} color="white" />
        </Pressable>
        <Text className="text-xl font-bold text-white text-center">
          {currentCard.definition}
        </Text>
      </View>

      <View>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          editable={status === "idle"}
          placeholder="Type your answer here..."
          placeholderTextColor="#94a3b8"
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl text-center text-lg font-bold border-2 ${
            status === "idle"
              ? "border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"
              : status === "correct"
                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
                : "border-red-500 text-red-600 bg-red-50 dark:bg-red-950"
          }`}
        />

        {status === "idle" && (
          <Pressable
            onPress={() => {
              if (hasInput) handleSubmit();
            }}
            className="mt-4 p-4 rounded-2xl items-center bg-indigo-600 shadow-md"
            style={{ opacity: hasInput ? 1 : 0.5 }}
          >
            <Text className="font-black text-lg uppercase tracking-wider text-white">
              CHECK
            </Text>
          </Pressable>
        )}

        {status === "wrong" && (
          <Text className="text-red-500 text-center font-bold mt-4 text-lg">
            Correct answer:{" "}
            <Text className="text-red-600 font-black">{currentCard.term}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};
