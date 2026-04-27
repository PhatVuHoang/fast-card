import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 400;

export const CARD_WIDTH = isSmallScreen
  ? width - 48
  : Math.min(width - 32, 360);
export const CARD_HEIGHT = isSmallScreen ? 280 : 320;
export const SWIPE_THRESHOLD = width * 0.25;

export const playSound = (text: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 0.9 });
};
