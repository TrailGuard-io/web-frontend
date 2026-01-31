import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "../store/user";
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ASSISTANCE_CHANNEL_OPTIONS,
  ASSISTANCE_STATUS_OPTIONS,
  DRIVETRAIN_OPTIONS,
  PROBLEM_OPTIONS,
  TERRAIN_OPTIONS,
  VEHICLE_OPTIONS,
} from "../lib/rescueOptions";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface Rescue {
  id: number;
  latitude: number;
  longitude: number;
  message: string | null;
  status: string;
  vehicleType?: string | null;
  drivetrain?: string | null;
  terrainType?: string | null;
  problemType?: string | null;
  assistanceStatus?: string | null;
  assistanceChannel?: string | null;
  assistanceProvider?: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [rescueIcon, setRescueIcon] = useState<any>(null);
  const [userIcon, setUserIcon] = useState<any>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [message, setMessage] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [terrainType, setTerrainType] = useState("");
  const [problemType, setProblemType] = useState("");
  const [assistanceStatus, setAssistanceStatus] = useState("");
  const [assistanceChannel, setAssistanceChannel] = useState("");
  const [assistanceProvider, setAssistanceProvider] = useState("");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      setRescueIcon(
        L.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
      setUserIcon(
        L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => console.warn(t("location_unavailable"))
      );
    }
  }, []);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    if (!token) setToken(storedToken);

    const fetchRescues = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rescue/my`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setRescues(data);
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchRescues();
  }, [token, router, setToken]);

  const obtenerUbicacion = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        alert(t("error_fetch_location"));
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const formatRescueStatus = (value?: string | null) =>
    value ? t(`rescue_status_${value}`, { defaultValue: value }) : "";

  if (loading) return <p className="p-4 text-ink-muted">{t("loading_rescues")}</p>;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("main_panel")}
                </p>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {t("rescue_list")}
                </h1>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                {t("active_count", { count: rescues.length })}
              </span>
            </div>

            {rescues.length === 0 ? (
              <p className="mt-4 text-ink-muted">{t("no_rescues")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {rescues.map((rescue) => (
                  <li
                    key={rescue.id}
                    className="rounded-2xl border border-slate-100/80 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm text-ink">
                      <strong>{t("location")}:</strong> {rescue.latitude},{" "}
                      {rescue.longitude}
                    </p>
                    <p className="text-sm text-ink-muted">
                      <strong>{t("message")}:</strong> {rescue.message || "—"}
                    </p>
                    <p className="text-sm text-ink-muted">
                      <strong>{t("status")}:</strong> {formatRescueStatus(rescue.status)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {t("date")}: {new Date(rescue.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            id="rescue-form"
            className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur"
          >
            <h2 className="font-display text-xl font-semibold text-ink">
              {t("request_rescue")}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {t("send_location_description")}
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const storedToken = token || localStorage.getItem("token");
                if (!storedToken) return;

                try {
                  const payload: Record<string, any> = {
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                  };

                  if (message) payload.message = message;
                  if (vehicleType) payload.vehicleType = vehicleType;
                  if (drivetrain) payload.drivetrain = drivetrain;
                  if (terrainType) payload.terrainType = terrainType;
                  if (problemType) payload.problemType = problemType;
                  if (assistanceStatus) payload.assistanceStatus = assistanceStatus;
                  if (assistanceChannel) payload.assistanceChannel = assistanceChannel;
                  if (assistanceProvider) payload.assistanceProvider = assistanceProvider;

                  const res = await fetch(`${API_BASE_URL}/api/rescue/request`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${storedToken}`,
                    },
                    body: JSON.stringify(payload),
                  });

                  const data = await res.json();
                  if (!res.ok) return alert(data.error || t("error"));

                  setRescues((prev) => [data, ...prev]);
                  setLat("");
                  setLng("");
            setMessage("");
            setVehicleType("");
            setDrivetrain("");
            setTerrainType("");
            setProblemType("");
            setAssistanceStatus("");
            setAssistanceChannel("");
            setAssistanceProvider("");
          } catch {
            alert(t("connection_error"));
          }
        }}
        className="mt-5 space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={t("latitude")}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={t("longitude")}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={obtenerUbicacion}
                disabled={locating}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-pill transition hover:-translate-y-0.5"
              >
                {locating ? t("location_fetching") : t("use_location")}
              </button>

              <textarea
                name="message"
                placeholder={t("optional_message")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                rows={3}
              ></textarea>

              <div className="rounded-2xl border border-slate-100/80 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("incident_details")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("vehicle_type")}</option>
                    {VEHICLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`vehicle_${option}`)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={drivetrain}
                    onChange={(e) => setDrivetrain(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("drivetrain")}</option>
                    {DRIVETRAIN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`drivetrain_${option}`)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={terrainType}
                    onChange={(e) => setTerrainType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("terrain_type")}</option>
                    {TERRAIN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`terrain_${option}`)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("problem_type")}</option>
                    {PROBLEM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`problem_${option}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100/80 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("helper_status")}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={assistanceStatus}
                    onChange={(e) => setAssistanceStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("assistance_status")}</option>
                    {ASSISTANCE_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`assistance_status_${option}`)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={assistanceChannel}
                    onChange={(e) => setAssistanceChannel(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">{t("assistance_channel")}</option>
                    {ASSISTANCE_CHANNEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {t(`assistance_channel_${option}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  value={assistanceProvider}
                  onChange={(e) => setAssistanceProvider(e.target.value)}
                  placeholder={t("assistance_provider")}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
              >
                {t("send_request")}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          {(rescues.length > 0 || userLocation) && rescueIcon && (
            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-4 shadow-card backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{t("live_map")}</h3>
                <span className="text-xs text-ink-muted">{t("updated")}</span>
              </div>
              <div className="h-80 overflow-hidden rounded-2xl">
                <MapContainer
                  center={
                    userLocation || [
                      rescues[0]?.latitude ?? 0,
                      rescues[0]?.longitude ?? 0,
                    ]
                  }
                  zoom={13}
                  scrollWheelZoom={false}
                  className="h-full w-full z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {rescues.map((rescue) => (
                    <Marker
                      key={rescue.id}
                      position={[rescue.latitude, rescue.longitude]}
                      icon={rescueIcon}
                    >
                      <Popup>
                        {rescue.message || "—"}
                        <br />
                        {t("status")}: {formatRescueStatus(rescue.status)}
                      </Popup>
                    </Marker>
                  ))}
                  {userLocation && userIcon && (
                    <Marker position={userLocation} icon={userIcon}>
                      <Popup>{t("you_are_here")}</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          )}
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
