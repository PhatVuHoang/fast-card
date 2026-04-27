import { db } from "@db/client";
import { cards, decks } from "@db/schema";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ImportScreen() {
  const [deckName, setDeckName] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleImport = async () => {
    if (!deckName || !content)
      return Alert.alert("Thiếu thông tin rồi bạn ơi!");

    try {
      const newDeck = await db
        .insert(decks)
        .values({ name: deckName })
        .returning();
      const deckId = newDeck[0].id;

      const lines = content.split("\n");
      const cardData = lines
        .map((line) => {
          const [term, def] = line.split(/[-:]/);
          return {
            deckId,
            term: term?.trim(),
            definition: def?.trim(),
            nextReview: new Date(),
          };
        })
        .filter((c) => c.term && c.definition);

      await db.insert(cards).values(cardData);

      Alert.alert("Xong!", `Đã nạp ${cardData.length} thẻ vào bộ ${deckName}`);
      router.replace("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View className="flex-1 p-6 bg-slate-50">
      <TextInput
        placeholder="Tên bộ thẻ (VD: IELTS Topic 1)"
        className="bg-white p-4 rounded-2xl mb-4 shadow-sm text-lg"
        value={deckName}
        onChangeText={setDeckName}
      />
      <TextInput
        placeholder="Dán dữ liệu: Từ - Nghĩa (Mỗi dòng 1 thẻ)"
        multiline
        className="bg-white p-4 rounded-2xl flex-1 shadow-sm text-base"
        textAlignVertical="top"
        value={content}
        onChangeText={setContent}
      />
      <TouchableOpacity
        onPress={handleImport}
        className="bg-indigo-600 p-4 rounded-2xl mt-6 items-center shadow-lg"
      >
        <Text className="text-white font-bold text-lg">Bắt đầu nạp thẻ 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}
