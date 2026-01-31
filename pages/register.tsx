import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegisterPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login_fill_fields"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("password_mismatch"));
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      toast.error(t("accept_policies"));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email,
          password,
          acceptTerms,
          acceptPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("register_failed"));
        return;
      }

      toast.success(t("register_success"));
      router.push("/login");
    } catch {
      toast.error(t("connection_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <ToastContainer />
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
              {t("register")}
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-muted">{t("register_subtitle")}</p>

        <form onSubmit={register} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder={t("name_optional")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />
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
          <input
            type="password"
            required
            placeholder={t("confirm_password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />

          <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span>
              {t("accept_terms_prefix")}{" "}
              <button
                type="button"
                onClick={() => router.push("/terms")}
                className="font-semibold text-ink underline"
              >
                {t("terms_title")}
              </button>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span>
              {t("accept_privacy_prefix")}{" "}
              <button
                type="button"
                onClick={() => router.push("/privacy")}
                className="font-semibold text-ink underline"
              >
                {t("privacy_title")}
              </button>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isSubmitting ? t("processing") : t("register_button")}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-ink-muted">
          {t("already_have_account")}{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-semibold text-ink hover:underline"
          >
            {t("login")}
          </button>
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
