import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useColorScheme } from "nativewind";
import { Dimensions, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 400;
const cardWidth = isSmallScreen ? width - 48 : Math.min(width - 32, 360);
const cardHeight = isSmallScreen ? 280 : 320;
const SWIPE_THRESHOLD = width * 0.25;

export const Flashcard = ({
  term,
  definition,
  onSwipe,
}: {
  term: string;
  definition: string;
  onSwipe?: (isMastered: boolean) => void;
}) => {
  const spin = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(width * 1.5, {
          velocity: event.velocityX,
        });
        if (onSwipe) runOnJS(onSwipe)(true);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-width * 1.5, {
          velocity: event.velocityX,
        });
        if (onSwipe) runOnJS(onSwipe)(false);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      translateX.value,
      [-width / 2, width / 2],
      [-15, 15],
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

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

  const overlayStyle = useAnimatedStyle(() => {
    const opacityRight = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.5],
      "clamp",
    );
    const opacityLeft = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 0.5],
      "clamp",
    );

    return {
      backgroundColor: translateX.value > 0 ? "#4ade80" : "#f87171",
      opacity: translateX.value > 0 ? opacityRight : opacityLeft,
    };
  });

  const playSound = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 0.9 });
  };

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, { damping: 10, mass: 1 }, () => {
      scale.value = withSpring(1, { damping: 10, mass: 1 });
    });
    spin.value = withSpring(spin.value === 0 ? 1 : 0, { damping: 12, mass: 1 });
  };

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
    >
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
      <Text
        className={`text-xs font-semibold tracking-wider ${isFront ? "text-indigo-500 dark:text-indigo-400" : "text-indigo-200"}`}
      >
        {isFront ? "TAP TO REVEAL" : "TAP TO GO BACK"}
      </Text>
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
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[animatedCardStyle, { width: cardWidth, height: cardHeight }]}
      >
        <Animated.View style={[frontStyle, cardStyle]}>
          <View className="absolute inset-0 bg-white dark:bg-slate-900 rounded-4xl" />
          <View className="absolute inset-0 rounded-4xl shadow-2xl" />
          <Animated.View
            style={[
              overlayStyle,
              { position: "absolute", inset: 0, zIndex: 1 },
            ]}
          />
          <CardContent text={term} isFront={true} />

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              playSound(term);
            }}
            className="absolute top-6 right-6 bg-white dark:bg-slate-700 rounded-full shadow-lg p-3 z-50"
          >
            <MaterialCommunityIcons
              name="volume-high"
              size={24}
              color={isDark ? "#818CF8" : "#4F46E5"}
            />
          </Pressable>
        </Animated.View>

        <Animated.View style={[backStyle, cardStyle]}>
          <View className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-4xl" />
          <Animated.View
            style={[
              overlayStyle,
              { position: "absolute", inset: 0, zIndex: 1 },
            ]}
          />
          <CardContent text={definition} isFront={false} />
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              playSound(definition);
            }}
            className="absolute top-6 right-6 bg-indigo-400 bg-opacity-60 rounded-full shadow-lg p-3 z-50"
          >
            <MaterialCommunityIcons
              name="volume-high"
              size={24}
              color="white"
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};
