import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface FlashCardProps {
  term: string;
  definition: string;
}

export const FlashCard = (props: FlashCardProps) => {
  const { term, definition } = props;

  const spin = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(spin.value, [0, 1], [0, 180])}deg` }],
    zIndex: spin.value > 0.5 ? 0 : 1,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(spin.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value === 0 ? 1 : 0);
  };

  return (
    <Pressable
      onPress={handleFlip}
      className="w-80 h-52 items-center justify-center"
    >
      <Animated.View
        style={frontStyle}
        className="absolute w-full h-full bg-white rounded-3xl p-6 shadow-xl border border-gray-100 items-center justify-center"
      >
        <Text className="text-2xl font-bold text-slate-800">{term}</Text>
      </Animated.View>
      <Animated.View
        style={backStyle}
        className="absolute w-full h-full bg-indigo-50 rounded-3xl p-6 shadow-xl border border-indigo-100 items-center justify-center"
      >
        <Text className="text-xl text-center text-indigo-900">
          {definition}
        </Text>
      </Animated.View>
    </Pressable>
  );
};
