import { useState } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "../store/user";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const setToken = useUserStore((state) => state.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login_fill_fields"));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("login_invalid"));
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      toast.success(t("login_success"));
      router.push("/dashboard");
    } catch {
      toast.error(t("connection_error"));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-red-100 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-100 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[32px] bg-white/90 p-8 shadow-card backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo2.png"
            alt="TrailGuard"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500">
              {t("official_system")}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t("login")}
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-muted">
          {t("login_subtitle")}
        </p>

        <form onSubmit={login} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
          >
            {t("login")}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted">
          <div className="h-px flex-1 bg-slate-200" />
          <span>{t("or_continue_with")}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
          >
            <svg
              data-testid="google-icon"
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M23.04 12.261c0-.816-.073-1.6-.209-2.348H12v4.444h6.189a5.29 5.29 0 0 1-2.293 3.47v2.87h3.71c2.17-2 3.434-4.95 3.434-8.436Z"
                fill="#4285F4"
              />
              <path
                d="M12 24c3.24 0 5.955-1.074 7.94-2.903l-3.71-2.87c-1.03.694-2.35 1.104-4.23 1.104-3.126 0-5.777-2.11-6.72-4.944H1.446v3.004A12 12 0 0 0 12 24Z"
                fill="#34A853"
              />
              <path
                d="M5.28 14.387A7.206 7.206 0 0 1 4.9 12c0-.828.141-1.632.38-2.387V6.61H1.446A12 12 0 0 0 0 12c0 1.94.464 3.77 1.446 5.39l3.834-3.003Z"
                fill="#FBBC05"
              />
              <path
                d="M12 4.76c1.764 0 3.35.606 4.599 1.794l3.45-3.45C17.95 1.075 15.24 0 12 0A12 12 0 0 0 1.446 6.61l3.834 3.003C6.223 6.87 8.874 4.76 12 4.76Z"
                fill="#EA4335"
              />
            </svg>
            {t("continue_with_google")}
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
          >
            <svg
              data-testid="facebook-icon"
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M13.5 8.667V7.2c0-.72.48-.9.82-.9h1.68V3.6H13.5c-2.49 0-3.86 1.86-3.86 3.86v1.207H8v2.7h1.64V20h3.86v-8.627h2.6l.4-2.706h-3Z"
                fill="#1877F2"
              />
            </svg>
            {t("continue_with_facebook")}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-ink-muted">
          {t("no_account")}{" "}
          <button
            onClick={() => router.push("/register")}
            className="font-semibold text-ink hover:underline"
          >
            {t("create_account")}
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-ink-muted">
          {t("by_continuing")}{" "}
          <button
            onClick={() => router.push("/terms")}
            className="font-semibold text-ink hover:underline"
          >
            {t("terms_title")}
          </button>{" "}
          {t("and")}{" "}
          <button
            onClick={() => router.push("/privacy")}
            className="font-semibold text-ink hover:underline"
          >
            {t("privacy_title")}
          </button>
          .
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
