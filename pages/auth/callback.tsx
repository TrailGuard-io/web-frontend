import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useUserStore } from "../../store/user";

export default function AuthCallbackPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const setToken = useUserStore((state) => state.setToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const token = router.query.token;
    const oauthError = router.query.error;

    if (typeof token === "string" && token.length > 0) {
      localStorage.setItem("token", token);
      setToken(token);
      router.replace("/dashboard");
      return;
    }

    if (typeof oauthError === "string") {
      setError(oauthError);
    } else {
      setError("oauth_failed");
    }
  }, [router, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[32px] bg-white/90 p-8 text-center shadow-card backdrop-blur">
        {error ? (
          <>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t("oauth_login_failed")}
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              {t("oauth_try_again")}
            </p>
            <p className="mt-2 text-xs text-ink-muted">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-white shadow-pill"
            >
              {t("back_to_login")}
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
            <p className="mt-4 text-ink-muted">{t("oauth_processing")}</p>
          </>
        )}
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
