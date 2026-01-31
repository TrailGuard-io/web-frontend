import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function TermsPage() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {t("legal")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
          {t("terms_title")}
        </h1>
        <p className="mt-4 text-sm text-ink-muted">{t("terms_intro")}</p>

        <div className="mt-8 space-y-6 text-sm text-ink-muted">
          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("terms_safety_title")}
            </h2>
            <p className="mt-2">{t("terms_safety_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("terms_offroad_title")}
            </h2>
            <p className="mt-2">{t("terms_offroad_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("terms_data_title")}
            </h2>
            <p className="mt-2">{t("terms_data_body")}</p>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">
              {t("terms_membership_title")}
            </h2>
            <p className="mt-2">{t("terms_membership_body")}</p>
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
