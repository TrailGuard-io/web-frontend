import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useUserStore } from "../store/user";

interface UserProfile {
  id: number;
  email: string;
  name?: string | null;
  role: string;
}

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const clear = useUserStore((state) => state.clear);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    if (!token) setToken(storedToken);

    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => undefined);
  }, [token, router, setToken]);

  const handleDelete = async () => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;
    if (confirmText !== "DELETE") return;

    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (!res.ok) {
        return alert(t("delete_failed"));
      }
      localStorage.removeItem("token");
      clear();
      alert(t("delete_success"));
      router.push("/login");
    } catch {
      alert(t("connection_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    const storedToken = token || localStorage.getItem("token");
    setIsLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      });
    } catch {
      // Ignore logout network errors and clear locally.
    } finally {
      localStorage.removeItem("token");
      clear();
      setIsLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("account_settings")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            {t("settings")}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t("settings_subtitle")}</p>
        </div>

        <div className="rounded-[24px] border border-slate-100/80 bg-white/90 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">{t("profile")}</h2>
          {profile ? (
            <div className="mt-4 space-y-2 text-sm text-ink-muted">
              <p>
                <span className="font-semibold text-ink">{t("name")}: </span>
                {profile.name || t("name_empty")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("email")}: </span>
                {profile.email}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("role")}: </span>
                {profile.role}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">{t("loading")}</p>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-100/80 bg-white/90 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">{t("logout")}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {t("logout_description")}
          </p>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoggingOut ? t("processing") : t("logout")}
          </button>
        </div>

        <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-6">
          <h2 className="text-lg font-semibold text-rose-700">
            {t("delete_account")}
          </h2>
          <p className="mt-2 text-sm text-rose-700/80">
            {t("delete_account_warning")}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs font-semibold text-rose-700">
              {t("delete_confirm_label")}
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t("delete_confirm_placeholder")}
              className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-900 placeholder:text-rose-300 focus:border-rose-400 focus:outline-none"
            />
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="self-start rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isDeleting ? t("processing") : t("delete_account")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
