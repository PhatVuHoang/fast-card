import { db } from "@db/client";
import { cards } from "@db/schema";
import { asc, gt } from "drizzle-orm";
import Constants from "expo-constants";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

export type NotificationSetupResult =
  | { ok: true }
  | { ok: false; reason: "expo-go" | "permission-denied" };

export type NotificationScheduleResult =
  | { ok: true; scheduledFor: Date }
  | {
      ok: false;
      reason:
        | "expo-go"
        | "permission-denied"
        | "no-upcoming-card"
        | "invalid-trigger";
    };

let cachedNotificationsModule: NotificationsModule | null | undefined;
let notificationHandlerConfigured = false;

function isExpoGo() {
  return Constants.executionEnvironment === "storeClient";
}

function getNotificationsModule(): NotificationsModule | null {
  if (cachedNotificationsModule !== undefined) {
    return cachedNotificationsModule;
  }

  if (isExpoGo()) {
    cachedNotificationsModule = null;
    return cachedNotificationsModule;
  }

  cachedNotificationsModule =
    require("expo-notifications") as NotificationsModule;
  return cachedNotificationsModule;
}

function ensureNotificationHandler() {
  const notifications = getNotificationsModule();
  if (!notifications || notificationHandlerConfigured) {
    return notifications;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
  return notifications;
}

export async function setupNotifications() {
  const notifications = ensureNotificationHandler();
  if (!notifications) {
    return { ok: false, reason: "expo-go" } satisfies NotificationSetupResult;
  }

  if (Platform.OS === "android") {
    await notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
    });
  }

  const { status: existingStatus } = await notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return {
      ok: false,
      reason: "permission-denied",
    } satisfies NotificationSetupResult;
  }

  return { ok: true } satisfies NotificationSetupResult;
}

export async function scheduleStudyReminder() {
  const notifications = ensureNotificationHandler();
  if (!notifications) {
    return {
      ok: false,
      reason: "expo-go",
    } satisfies NotificationScheduleResult;
  }

  const { status } = await notifications.getPermissionsAsync();
  if (status !== "granted") {
    return {
      ok: false,
      reason: "permission-denied",
    } satisfies NotificationScheduleResult;
  }

  await notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  try {
    const upcomingCards = await db
      .select()
      .from(cards)
      .where(gt(cards.nextReview, now))
      .orderBy(asc(cards.nextReview))
      .limit(1);

    if (upcomingCards.length > 0 && upcomingCards[0].nextReview) {
      const nextReviewDate = new Date(upcomingCards[0].nextReview);

      const secondsUntilReview = Math.floor(
        (nextReviewDate.getTime() - now.getTime()) / 1000,
      );

      if (secondsUntilReview > 0) {
        await notifications.scheduleNotificationAsync({
          content: {
            title: "Time to review! 📚",
            body: "You have cards waiting for you. Let's keep your memory fresh!",
            sound: true,
          },
          trigger: {
            type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntilReview,
          },
        });

        return {
          ok: true,
          scheduledFor: nextReviewDate,
        } satisfies NotificationScheduleResult;
      }

      return {
        ok: false,
        reason: "invalid-trigger",
      } satisfies NotificationScheduleResult;
    }

    return {
      ok: false,
      reason: "no-upcoming-card",
    } satisfies NotificationScheduleResult;
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      reason: "invalid-trigger",
    } satisfies NotificationScheduleResult;
  }
}
