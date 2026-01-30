import { useEffect, useState } from "react";
import { useUserStore } from "../store/user";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

interface SubscriptionPlan {
  name: string;
  price: number;
  duration: number;
  features: string[];
}

interface CurrentSubscription {
  currentPlan: string;
  expiresAt?: string;
  subscription?: any;
  features: string[];
}

export default function SubscriptionPage() {
  const { t } = useTranslation("common");
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const token = useUserStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      const stored = localStorage.getItem("token");
      if (!stored) return router.push("/login");
    }

    Promise.all([
      fetch("http://localhost:3001/api/subscriptions/plans").then(res => res.json()),
      fetch("http://localhost:3001/api/subscriptions/current", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json())
    ])
      .then(([plansData, currentData]) => {
        setPlans(plansData);
        setCurrentSubscription(currentData);
        setIsLoading(false);
      })
      .catch(() => {
        alert("Error al cargar información de suscripción");
        setIsLoading(false);
      });
  }, [token]);

  const handleSubscribe = async (planType: 'premium' | 'pro') => {
    if (!confirm(`¿Confirmas la suscripción al plan ${plans[planType]?.name} por $${plans[planType]?.price}/mes?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Mock payment ID - in a real app, you'd integrate with Stripe, PayPal, etc.
      const mockPaymentId = `mock_payment_${Date.now()}`;
      
      const response = await fetch("http://localhost:3001/api/subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: planType,
          paymentId: mockPaymentId,
        }),
      });

      if (response.ok) {
        alert("¡Suscripción exitosa!");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Error al procesar la suscripción");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción?")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/subscriptions/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Suscripción cancelada exitosamente");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Error al cancelar la suscripción");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading_subscription_info")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Membresías
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">{t("subscription")}</h1>
          <p className="mt-2 text-lg text-ink-muted">{t("choose_plan_description")}</p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mx-auto mb-12 max-w-2xl">
            <div className="rounded-[24px] border border-slate-100/80 bg-white/90 p-6 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {t("current_plan")}: {t(`plan_${currentSubscription.currentPlan}`)}
                  </h3>
                  {currentSubscription.expiresAt && (
                    <p className="mt-1 text-ink-muted">
                      {t("expires_on")}: {new Date(currentSubscription.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {currentSubscription.currentPlan !== 'free' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
                  >
                    {t("cancel_subscription")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 shadow-card backdrop-blur">
              <div className="p-6">
                <h3 className="mb-2 text-2xl font-semibold text-ink">{t("free_plan")}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-semibold text-ink">$0</span>
                  <span className="text-ink-muted">/{t("month")}</span>
                </div>
                <ul className="mb-6 space-y-3 text-sm text-ink-muted">
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("basic_rescue_requests")}
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("view_public_rescues")}
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("basic_profile")}
                  </li>
                </ul>
                <div className="rounded-full bg-slate-100 py-3 text-center text-sm font-semibold text-ink">
                  {t("always_free")}
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            {plans.premium && (
              <div className="rounded-[28px] border border-slate-100/80 bg-white/90 shadow-card backdrop-blur">
                <div className="p-6">
                  <h3 className="mb-2 text-2xl font-semibold text-ink">{plans.premium.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-semibold text-ink">${plans.premium.price}</span>
                    <span className="text-ink-muted">/{t("month")}</span>
                  </div>
                  <ul className="mb-6 space-y-3 text-sm text-ink-muted">
                    {plans.premium.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {currentSubscription?.currentPlan === 'premium' ? (
                    <div className="flex items-center justify-center rounded-full bg-emerald-100 py-3 text-sm font-semibold text-emerald-700">
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("current_plan")}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe('premium')}
                      disabled={isProcessing}
                      className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {isProcessing ? t("processing") : t("upgrade_to_premium")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pro Plan */}
            {plans.pro && (
              <div className="relative rounded-[28px] border border-slate-100/80 bg-white/90 shadow-card backdrop-blur">
                <div className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                  {t("most_popular")}
                </div>
                <div className="p-6 pt-12">
                  <h3 className="mb-2 text-2xl font-semibold text-ink">{plans.pro.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-semibold text-ink">${plans.pro.price}</span>
                    <span className="text-ink-muted">/{t("month")}</span>
                  </div>
                  <ul className="mb-6 space-y-3 text-sm text-ink-muted">
                    {plans.pro.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="mr-2 h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {currentSubscription?.currentPlan === 'pro' ? (
                    <div className="flex items-center justify-center rounded-full bg-red-100 py-3 text-sm font-semibold text-red-700">
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("current_plan")}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe('pro')}
                      disabled={isProcessing}
                      className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {isProcessing ? t("processing") : t("upgrade_to_pro")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-semibold text-ink">{t("why_upgrade")}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-100/80 bg-white/80 p-6 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink">{t("team_collaboration")}</h3>
              <p className="text-sm text-ink-muted">{t("team_collaboration_description")}</p>
            </div>

            <div className="rounded-[24px] border border-slate-100/80 bg-white/80 p-6 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink">{t("expedition_planning")}</h3>
              <p className="text-sm text-ink-muted">{t("expedition_planning_description")}</p>
            </div>

            <div className="rounded-[24px] border border-slate-100/80 bg-white/80 p-6 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <svg className="h-8 w-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ink">{t("real_time_chat")}</h3>
              <p className="text-sm text-ink-muted">{t("real_time_chat_description")}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-[20px] border border-slate-100/80 bg-white/80 p-4">
            <div className="flex">
              <svg className="mr-2 mt-1 h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-ink-muted">
                {t("subscription_note")}
              </p>
            </div>
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
