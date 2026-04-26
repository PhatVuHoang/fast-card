import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const Flashcard = ({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) => {
  const spin = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(spin.value, [0, 1], [0, 180])}deg` }],
    zIndex: spin.value > 0.5 ? 0 : 1,
    opacity: interpolate(spin.value, [0, 0.5, 1], [1, 0.8, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(spin.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(spin.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const playSound = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    spin.value = withTiming(spin.value === 0 ? 1 : 0, { duration: 600 });
  };

  return (
    <View className="w-80 h-64 items-center justify-center" accessible={false}>
      {/* Front Side - Term */}
      <Animated.View
        style={frontStyle}
        className="absolute w-full h-full bg-gradient-to-br from-white to-indigo-50 rounded-3xl overflow-hidden"
        accessibilityLabel="Flashcard - front side"
        accessibilityRole="button"
        accessibilityHint="Double tap to flip and see the definition"
      >
        <Pressable
          onPress={handleFlip}
          className="flex-1 items-center justify-center p-8 shadow-lg"
          accessibilityRole="button"
          accessibilityLabel={`Term: ${term}. Double tap to reveal definition`}
        >
          <Text className="text-4xl font-black text-indigo-950 text-center leading-tight">
            {term}
          </Text>
          <Text className="text-indigo-400 text-xs font-semibold mt-6 tracking-wider">
            TAP TO REVEAL
          </Text>
        </Pressable>

        {/* Sound Button */}
        <Pressable
          onPress={() => playSound(term)}
          className="absolute top-6 right-6 bg-white p-3 rounded-full shadow-md active:shadow-lg active:scale-95 transition-all"
          accessibilityRole="button"
          accessibilityLabel={`Pronunciation: ${term}`}
          accessibilityHint="Double tap to hear pronunciation"
        >
          <Ionicons name="volume-medium" size={24} color="#4F46E5" />
        </Pressable>
      </Animated.View>

      {/* Back Side - Definition */}
      <Animated.View
        style={backStyle}
        className="absolute w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl overflow-hidden shadow-xl"
        accessibilityLabel="Flashcard - back side"
        accessibilityRole="button"
        accessibilityHint="Double tap to flip and see the term"
      >
        <Pressable
          onPress={handleFlip}
          className="flex-1 items-center justify-center p-8"
          accessibilityRole="button"
          accessibilityLabel={`Definition: ${definition}. Double tap to go back to term`}
        >
          <Text className="text-lg text-center font-semibold text-white leading-8">
            {definition}
          </Text>
          <Text className="text-indigo-200 text-xs font-medium mt-6 tracking-wider">
            TAP TO GO BACK
          </Text>
        </Pressable>

        {/* Sound Button for Definition */}
        <Pressable
          onPress={() => playSound(definition)}
          className="absolute top-6 right-6 bg-indigo-500 bg-opacity-50 p-3 rounded-full shadow-md active:shadow-lg active:scale-95 transition-all"
          accessibilityRole="button"
          accessibilityLabel={`Pronunciation: definition`}
          accessibilityHint="Double tap to hear pronunciation"
        >
          <Ionicons name="volume-medium" size={24} color="white" />
        </Pressable>
      </Animated.View>
    </View>
  );
};
