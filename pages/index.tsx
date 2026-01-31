import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("home_title")}</title>
        <meta
          name="description"
          content={t("home_description")}
        />
      </Head>
      <main className="min-h-screen px-4 py-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-pill">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-red-500">
                {t("official_system")}
              </span>
              <span className="h-1 w-1 rounded-full bg-red-400"></span>
              <span className="text-xs font-semibold text-ink-muted">
                {t("home_location")}
              </span>
            </div>

            <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
              TrailGuard
            </h1>
            <p className="text-lg text-ink-muted md:text-xl">
              {t("welcome_main")}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/login")}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
              >
                {t("login_button")}
              </button>
              <button
                onClick={() => router.push("/rescue")}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-pill transition hover:-translate-y-0.5"
              >
                {t("view_live_map")}
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {t("coordinated_rescues")}
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400"></span>
                {t("active_alerts")}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 right-6 h-32 w-32 rounded-full bg-red-100 blur-3xl"></div>
            <div className="absolute -bottom-8 left-4 h-32 w-32 rounded-full bg-sky-100 blur-3xl"></div>

            <div className="relative rounded-[32px] bg-white/80 p-6 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/logo.png"
                    alt="TrailGuard"
                    width={64}
                    height={64}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                      {t("official_system")}
                    </p>
                    <p className="font-display text-lg font-semibold text-ink">
                      {t("quick_panel")}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                  {t("live")}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                    {t("current_status")}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-ink">
                    {t("active_reports_count", { count: 12 })}
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-ink-muted">
                  {t("home_card_blurb")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
