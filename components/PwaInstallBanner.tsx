import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed";

const isIosDevice = () =>
  /iphone|ipad|ipod/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent);

const isAndroidDevice = () =>
  /android/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent);

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
};

export default function PwaInstallBanner() {
  const { t } = useTranslation("common");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsIos(isIosDevice());
    setIsAndroid(isAndroidDevice());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dismissed) return;
    if (isStandaloneMode()) return;

    if (isIosDevice()) {
      setShowBanner(true);
    }
  }, [dismissed]);

  if (dismissed || isStandaloneMode()) return null;

  if (!showBanner) return null;

  const handleDismiss = () => {
    setShowBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1");
      setDismissed(true);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  if (!isIos && !isAndroid) return null;

  return (
    <div className="fixed inset-x-4 bottom-6 z-50">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-card backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{t("install_app_title")}</p>
            {isIos ? (
              <p className="text-xs text-ink-muted">{t("install_app_ios_hint")}</p>
            ) : (
              <p className="text-xs text-ink-muted">{t("install_app_android_hint")}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deferredPrompt && !isIos && (
              <button
                onClick={handleInstall}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-pill"
              >
                {t("install_app_action")}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-ink"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
