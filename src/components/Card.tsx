import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useColorScheme } from "nativewind";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 400;
const cardWidth = isSmallScreen ? width - 48 : Math.min(width - 32, 360);
const cardHeight = isSmallScreen ? 280 : 320;

export const Flashcard = ({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) => {
  const spin = useSharedValue(0);
  const scale = useSharedValue(1);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(spin.value, [0, 1], [0, 180])}deg` },
      { scale: scale.value },
    ],
    zIndex: spin.value > 0.5 ? 0 : 10,
    opacity: interpolate(spin.value, [0, 0.4, 0.6, 1], [1, 0.9, 0.1, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(spin.value, [0, 1], [180, 360])}deg` },
      { scale: scale.value },
    ],
    zIndex: spin.value > 0.5 ? 10 : 0,
    opacity: interpolate(spin.value, [0, 0.4, 0.6, 1], [0, 0.1, 0.9, 1]),
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
    scale.value = withSpring(0.95, { damping: 10, mass: 1 }, () => {
      scale.value = withSpring(1, { damping: 10, mass: 1 });
    });
    spin.value = withSpring(spin.value === 0 ? 1 : 0, {
      damping: 12,
      mass: 1,
    });
  };

  // Shared card content layout
  const CardContent = ({
    text,
    isFront,
  }: {
    text: string;
    isFront: boolean;
  }) => (
    <Pressable
      onPress={handleFlip}
      className="flex-1 w-full px-8 py-10 justify-center items-center"
      accessibilityRole="button"
      accessibilityLabel={isFront ? `Term: ${text}` : `Definition: ${text}`}
    >
      <View
        className={`absolute top-6 left-6 px-3 py-1 rounded-full ${
          isFront
            ? "bg-indigo-200 bg-opacity-40"
            : "bg-indigo-500 bg-opacity-40"
        }`}
      >
        <Text
          className={`text-xs font-bold tracking-wide ${
            isFront ? "text-indigo-700 dark:text-indigo-300" : "text-indigo-100"
          }`}
        >
          {isFront ? "TERM" : "DEFINITION"}
        </Text>
      </View>

      <View className="flex-1 w-full justify-center items-center px-4 gap-4">
        <Text
          className={`text-center leading-tight ${
            isFront
              ? "text-3xl sm:text-4xl font-black text-indigo-950 dark:text-white"
              : "text-lg sm:text-xl font-semibold text-white"
          }`}
          numberOfLines={isFront ? 4 : 8}
        >
          {text}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <View
          className={`w-6 h-0.5 rounded-full ${
            isFront
              ? "bg-gradient-to-r from-transparent to-indigo-300"
              : "bg-gradient-to-r from-transparent to-indigo-200"
          }`}
        />
        <Text
          className={`text-xs font-semibold tracking-wider ${
            isFront ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-200"
          }`}
        >
          {isFront ? "TAP TO REVEAL" : "TAP TO GO BACK"}
        </Text>
        <View
          className={`w-6 h-0.5 rounded-full ${
            isFront
              ? "bg-gradient-to-l from-transparent to-indigo-300"
              : "bg-gradient-to-l from-transparent to-indigo-200"
          }`}
        />
      </View>

      <View
        className={`absolute bottom-6 w-12 h-1 rounded-full ${
          isFront
            ? "bg-gradient-to-r from-green-400 to-green-300"
            : "bg-gradient-to-r from-blue-300 to-indigo-300"
        }`}
      />

      <View
        className={`absolute ${
          isFront ? "bottom-4 left-4" : "top-4 right-4"
        } w-2 h-2 bg-indigo-300 rounded-full ${
          isFront ? "opacity-50" : "opacity-40"
        }`}
      />
      <View
        className={`absolute ${
          isFront ? "bottom-6 left-7" : "top-6 right-7"
        } w-1.5 h-1.5 bg-indigo-200 rounded-full ${
          isFront ? "opacity-40" : "opacity-30"
        }`}
      />
    </Pressable>
  );

  const cardStyle = {
    position: "absolute" as const,
    width: cardWidth,
    height: cardHeight,
    borderRadius: 32,
    overflow: "hidden" as const,
  };

  return (
    <View style={{ width: cardWidth, height: cardHeight }} accessible={false}>
      {/* Front Side - Term */}
      <Animated.View
        style={[frontStyle, cardStyle]}
        accessibilityLabel="Flashcard - front side"
        accessibilityRole="button"
        accessibilityHint="Tap to flip and see the definition"
      >
        {/* Claymorphism: Outer shadows */}
        <View className="absolute inset-0 bg-white dark:bg-slate-900 rounded-4xl" />

        {/* Inner shadow effect */}
        <View className="absolute inset-0 rounded-4xl shadow-2xl" />

        <CardContent text={term} isFront={true} />

        {/* Sound Button - fixed position */}
        <Pressable
          onPress={() => playSound(term)}
          className="absolute top-6 right-6 bg-white dark:bg-slate-700 rounded-full shadow-lg active:shadow-xl active:scale-90 transition-all p-3"
          accessibilityRole="button"
          accessibilityLabel={`Pronunciation: ${term}`}
          accessibilityHint="Tap to hear pronunciation"
        >
          <MaterialCommunityIcons
            name="volume-high"
            size={24}
            color={isDark ? "#818CF8" : "#4F46E5"}
          />
        </Pressable>
      </Animated.View>

      {/* Back Side - Definition */}
      <Animated.View
        style={[backStyle, cardStyle]}
        accessibilityLabel="Flashcard - back side"
        accessibilityRole="button"
        accessibilityHint="Tap to flip and see the term"
      >
        {/* Claymorphism: Rich gradient background */}
        <View className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-4xl" />

        {/* Subtle pattern overlay */}
        <View className="absolute inset-0 opacity-5">
          <View className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <View className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-300 rounded-full blur-3xl" />
        </View>

        <CardContent text={definition} isFront={false} />

        {/* Sound Button for Definition - fixed position */}
        <Pressable
          onPress={() => playSound(definition)}
          className="absolute top-6 right-6 bg-indigo-400 bg-opacity-60 rounded-full shadow-lg active:shadow-xl active:scale-90 transition-all p-3"
          accessibilityRole="button"
          accessibilityLabel={`Pronunciation: definition`}
          accessibilityHint="Tap to hear pronunciation"
        >
          <MaterialCommunityIcons name="volume-high" size={24} color="white" />
        </Pressable>
      </Animated.View>
    </View>
  );
};
