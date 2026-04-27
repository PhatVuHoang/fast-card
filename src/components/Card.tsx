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

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, { damping: 10, mass: 1 }, () => {
      scale.value = withSpring(1, { damping: 10, mass: 1 });
    });
    spin.value = withSpring(spin.value === 0 ? 1 : 0, { damping: 12, mass: 1 });
  };

  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (event.x > cardWidth - 80 && event.y < 80) {
      return;
    }
    runOnJS(handleFlip)();
  });

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

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

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

  const playSound = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 0.9 });
  };

  const cardStyle = {
    position: "absolute" as const,
    width: cardWidth,
    height: cardHeight,
    borderRadius: 32,
    overflow: "hidden" as const,
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[animatedCardStyle, { width: cardWidth, height: cardHeight }]}
      >
        {/* FRONT */}
        <Animated.View
          style={[frontStyle, cardStyle]}
          className="bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-3xl font-black text-indigo-950 dark:text-white text-center">
              {term}
            </Text>
            <Text className="text-indigo-400 font-bold mt-4 text-[10px] tracking-widest uppercase">
              Tap to reveal
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

        {/* BACK */}
        <Animated.View
          style={[backStyle, cardStyle]}
          className="bg-indigo-600 shadow-xl"
        >
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-xl font-bold text-white text-center">
              {definition}
            </Text>
            <Text className="text-indigo-200 font-bold mt-4 text-[10px] tracking-widest uppercase">
              Tap to go back
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
