import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function PrivacyPage() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {t("legal")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
          {t("privacy_title")}
        </h1>
        <p className="mt-4 text-sm text-ink-muted">{t("privacy_intro")}</p>

        <div className="mt-8 space-y-6 text-sm text-ink-muted">
          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("privacy_collect_title")}
            </h2>
            <p className="mt-2">{t("privacy_collect_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("privacy_use_title")}
            </h2>
            <p className="mt-2">{t("privacy_use_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("privacy_share_title")}
            </h2>
            <p className="mt-2">{t("privacy_share_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("privacy_rights_title")}
            </h2>
            <p className="mt-2">{t("privacy_rights_body")}</p>
          </section>
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
