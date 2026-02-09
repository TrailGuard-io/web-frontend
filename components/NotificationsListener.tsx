import { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../lib/api";
import { useUserStore } from "../store/user";

type NotificationPayload = {
  id: number;
  userId: number;
  type: string;
  title?: string;
  message?: string | null;
  data?: {
    rescueId?: number;
    teamId?: number;
  } | null;
};

const buildMessage = (
  t: (key: string, options?: Record<string, any>) => string,
  notification: NotificationPayload
) => {
  const rescueId = notification.data?.rescueId;
  switch (notification.type) {
    case "rescue_candidate":
      return t("notification_rescue_candidate", { rescueId });
    case "rescue_assigned":
      return t("notification_rescue_assigned", { rescueId });
    case "rescue_message":
      return t("notification_rescue_message", { rescueId });
    case "rescue_candidate_rejected":
      return t("notification_rescue_candidate_rejected", { rescueId });
    case "rescue_resolved":
      return t("notification_rescue_resolved", { rescueId });
    default:
      return notification.message || notification.title || t("notification_generic");
  }
};

export default function NotificationsListener() {
  const { t } = useTranslation("common");
  const token = useUserStore((state) => state.token);
  const seenRef = useRef(new Set<number>());

  useEffect(() => {
    const storedToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!storedToken) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const abortController = new AbortController();

    const startStream = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/stream`, {
          headers: { Authorization: `Bearer ${storedToken}` },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("stream_failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            if (chunk.startsWith(":")) continue;
            const lines = chunk.split("\n");
            const dataLines = lines
              .filter((line) => line.startsWith("data:"))
              .map((line) => line.replace("data:", "").trim());

            if (dataLines.length === 0) continue;
            const dataStr = dataLines.join("\n");
            try {
              const payload = JSON.parse(dataStr) as NotificationPayload;
              if (!payload?.id) continue;
              if (seenRef.current.has(payload.id)) continue;
              seenRef.current.add(payload.id);
              toast.info(buildMessage(t, payload));
              fetch(`${API_BASE_URL}/api/notifications/${payload.id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${storedToken}` },
              }).catch(() => undefined);
            } catch {
              // ignore invalid payloads
            }
          }
        }
      } catch {
        if (!cancelled) {
          retryTimer = setTimeout(startStream, 3000);
        }
      }
    };

    startStream();

    return () => {
      cancelled = true;
      abortController.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [token, t]);

  return null;
}
