import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { CARD_HEIGHT, CARD_WIDTH, SWIPE_THRESHOLD, playSound } from "./shared";

const { width } = Dimensions.get("window");

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

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, { damping: 10, mass: 1 }, () => {
      scale.value = withSpring(1, { damping: 10, mass: 1 });
    });
    spin.value = withSpring(spin.value === 0 ? 1 : 0, { damping: 12, mass: 1 });
  };

  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (event.x > CARD_WIDTH - 80 && event.y < 80) return;
    runOnJS(handleFlip)();
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(width * 1.5);
        if (onSwipe) runOnJS(onSwipe)(true);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-width * 1.5);
        if (onSwipe) runOnJS(onSwipe)(false);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotateZ: `${interpolate(translateX.value, [-width / 2, width / 2], [-15, 15])}deg`,
      },
    ],
  }));

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

  const cardBaseStyle =
    "absolute rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl";

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[animatedCardStyle, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      >
        <Animated.View
          style={[frontStyle, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          className={`${cardBaseStyle} bg-white dark:bg-slate-900`}
        >
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-3xl font-black text-indigo-950 dark:text-white text-center">
              {term}
            </Text>
          </View>
          <Pressable
            onPress={() => playSound(term)}
            className="absolute top-6 right-6 p-4 bg-indigo-50 dark:bg-slate-800 rounded-full z-50"
          >
            <MaterialCommunityIcons
              name="volume-high"
              size={20}
              color="#4F46E5"
            />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={[backStyle, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          className={`${cardBaseStyle} bg-indigo-600`}
        >
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-xl font-bold text-white text-center">
              {definition}
            </Text>
          </View>
          <Pressable
            onPress={() => playSound(definition)}
            className="absolute top-6 right-6 p-4 bg-indigo-500 rounded-full z-50"
          >
            <MaterialCommunityIcons
              name="volume-high"
              size={20}
              color="white"
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};
