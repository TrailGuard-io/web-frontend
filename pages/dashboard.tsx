import { useEffect, useMemo, useState } from "react";
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

interface FeatureFlags {
  teams: boolean;
  expeditions: boolean;
}

interface TeamPreview {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  maxMembers: number;
  _count?: {
    members: number;
    expeditions: number;
  };
}

interface ExpeditionPreview {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  status: "planned" | "active" | "completed" | "cancelled";
  maxParticipants: number;
  team?: {
    id: number;
    name: string;
  };
  _count?: {
    members: number;
  };
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  expert: "bg-purple-100 text-purple-800",
};

const STATUS_COLORS = {
  planned: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const DEFAULT_CENTER: [number, number] = [-38.0055, -57.5426];

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
  const [updatingRescueId, setUpdatingRescueId] = useState<number | null>(null);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState(false);
  const [teamsPreview, setTeamsPreview] = useState<TeamPreview[]>([]);
  const [teamsTotal, setTeamsTotal] = useState(0);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState(false);
  const [expeditionsPreview, setExpeditionsPreview] = useState<
    ExpeditionPreview[]
  >([]);
  const [expeditionsTotal, setExpeditionsTotal] = useState(0);
  const [expeditionsLoading, setExpeditionsLoading] = useState(false);
  const [expeditionsError, setExpeditionsError] = useState(false);

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
        () => {
          console.warn(t("location_unavailable"));
          setUserLocation(DEFAULT_CENTER);
        }
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

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      setFlagsLoading(false);
      return;
    }

    if (!token) setToken(storedToken);

    setFlagsLoading(true);
    setFlagsError(false);

    fetch(`${API_BASE_URL}/api/flags`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFlags(data?.flags ?? null);
      })
      .catch(() => {
        setFlags({ teams: false, expeditions: false });
        setFlagsError(true);
      })
      .finally(() => setFlagsLoading(false));
  }, [token, setToken]);

  useEffect(() => {
    if (!flags?.teams) {
      setTeamsPreview([]);
      setTeamsTotal(0);
      setTeamsLoading(false);
      setTeamsError(false);
      return;
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    setTeamsLoading(true);
    setTeamsError(false);

    fetch(`${API_BASE_URL}/api/teams`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid teams response");
        }
        setTeamsTotal(data.length);
        setTeamsPreview(data.slice(0, 3));
      })
      .catch(() => {
        setTeamsPreview([]);
        setTeamsTotal(0);
        setTeamsError(true);
      })
      .finally(() => setTeamsLoading(false));
  }, [flags?.teams, token]);

  useEffect(() => {
    if (!flags?.expeditions) {
      setExpeditionsPreview([]);
      setExpeditionsTotal(0);
      setExpeditionsLoading(false);
      setExpeditionsError(false);
      return;
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    setExpeditionsLoading(true);
    setExpeditionsError(false);

    fetch(`${API_BASE_URL}/api/expeditions`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid expeditions response");
        }
        setExpeditionsTotal(data.length);
        setExpeditionsPreview(data.slice(0, 3));
      })
      .catch(() => {
        setExpeditionsPreview([]);
        setExpeditionsTotal(0);
        setExpeditionsError(true);
      })
      .finally(() => setExpeditionsLoading(false));
  }, [flags?.expeditions, token]);

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const formatRescueStatus = (value?: string | null) =>
    value ? t(`rescue_status_${value}`, { defaultValue: value }) : "";

  const activeRescues = useMemo(
    () => rescues.filter((rescue) => rescue.status !== "resolved"),
    [rescues]
  );
  const resolvedRescues = useMemo(
    () => rescues.filter((rescue) => rescue.status === "resolved"),
    [rescues]
  );

  const markResolved = async (rescueId: number) => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;
    setUpdatingRescueId(rescueId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rescue/${rescueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("error"));
        return;
      }
      setRescues((prev) =>
        prev.map((rescue) => (rescue.id === rescueId ? data : rescue))
      );
    } catch {
      alert(t("connection_error"));
    } finally {
      setUpdatingRescueId(null);
    }
  };

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
                {t("active_count", { count: activeRescues.length })}
              </span>
            </div>

            {activeRescues.length === 0 ? (
              <p className="mt-4 text-ink-muted">{t("no_rescues")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeRescues.map((rescue) => (
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
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => markResolved(rescue.id)}
                        disabled={updatingRescueId === rescue.id}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingRescueId === rescue.id
                          ? t("saving", { defaultValue: "Guardando..." })
                          : t("mark_resolved", { defaultValue: "Marcar como resuelto" })}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("history", { defaultValue: "Historial" })}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("resolved_rescues", { defaultValue: "Rescates resueltos" })}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {resolvedRescues.length}
              </span>
            </div>

            {resolvedRescues.length === 0 ? (
              <p className="mt-4 text-ink-muted">
                {t("no_resolved_rescues", { defaultValue: "No hay rescates resueltos." })}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {resolvedRescues.map((rescue) => (
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

        <div className="lg:sticky lg:top-24 space-y-4">
          {(activeRescues.length > 0 || userLocation) && rescueIcon && (
            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-4 shadow-card backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{t("live_map")}</h3>
                <span className="text-xs text-ink-muted">{t("updated")}</span>
              </div>
              <div className="h-80 overflow-hidden rounded-2xl">
                <MapContainer
                  center={userLocation || DEFAULT_CENTER}
                  zoom={13}
                  scrollWheelZoom={false}
                  className="h-full w-full z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {activeRescues.map((rescue) => (
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

          {!flagsLoading && flags && (
            <>
              {flags.teams ? (
                <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {t("team_coordination")}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {t("teams")}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                      {teamsLoading ? "..." : teamsTotal}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    {t("team_collaboration_description")}
                  </p>

                  <div className="mt-4 space-y-3">
                    {teamsLoading ? (
                      <p className="text-sm text-ink-muted">{t("loading_teams")}</p>
                    ) : teamsError ? (
                      <p className="text-sm text-rose-500">{t("error_loading_teams")}</p>
                    ) : teamsPreview.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                        <p className="font-semibold text-ink">
                          {t("no_teams_available")}
                        </p>
                        <p className="mt-1">{t("create_first_team")}</p>
                      </div>
                    ) : (
                      teamsPreview.map((team) => (
                        <div
                          key={team.id}
                          className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {team.name}
                              </p>
                              {team.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                                  {team.description}
                                </p>
                              )}
                            </div>
                            {!team.isPublic && (
                              <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600">
                                {t("private")}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              {team._count?.members || 0}/{team.maxMembers}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                />
                              </svg>
                              {team._count?.expeditions || 0}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => router.push("/teams")}
                    className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
                  >
                    {t("teams")}
                  </button>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {t("team_coordination")}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {t("teams")}
                      </h3>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {t("plan_premium")}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      flagsError ? "text-rose-500" : "text-ink-muted"
                    }`}
                  >
                    {flagsError ? t("connection_error") : t("premium_required")}
                  </p>
                  <button
                    onClick={() => router.push("/subscription")}
                    className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
                  >
                    {t("upgrade_to_premium")}
                  </button>
                </div>
              )}

              {flags.expeditions ? (
                <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {t("guided_exploration")}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {t("expeditions")}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                      {expeditionsLoading ? "..." : expeditionsTotal}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    {t("expedition_planning_description")}
                  </p>

                  <div className="mt-4 space-y-3">
                    {expeditionsLoading ? (
                      <p className="text-sm text-ink-muted">
                        {t("loading_expeditions")}
                      </p>
                    ) : expeditionsError ? (
                      <p className="text-sm text-rose-500">
                        {t("error_loading_expeditions")}
                      </p>
                    ) : expeditionsPreview.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                        <p className="font-semibold text-ink">
                          {t("no_expeditions_available")}
                        </p>
                        <p className="mt-1">{t("create_first_expedition")}</p>
                      </div>
                    ) : (
                      expeditionsPreview.map((expedition) => (
                        <div
                          key={expedition.id}
                          className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {expedition.title}
                              </p>
                              <p className="mt-1 text-xs text-ink-muted">
                                {formatDate(expedition.startDate)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_COLORS[expedition.status]}`}
                              >
                                {t(`status_${expedition.status}`)}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${DIFFICULTY_COLORS[expedition.difficulty]}`}
                              >
                                {t(`difficulty_${expedition.difficulty}`)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              {expedition._count?.members || 0}/{expedition.maxParticipants}
                            </span>
                            {expedition.team && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                  />
                                </svg>
                                {expedition.team.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => router.push("/expeditions")}
                    className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
                  >
                    {t("expeditions")}
                  </button>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                        {t("guided_exploration")}
                      </p>
                      <h3 className="font-display text-xl font-semibold text-ink">
                        {t("expeditions")}
                      </h3>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      {t("plan_premium")}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      flagsError ? "text-rose-500" : "text-ink-muted"
                    }`}
                  >
                    {flagsError ? t("connection_error") : t("premium_required")}
                  </p>
                  <button
                    onClick={() => router.push("/subscription")}
                    className="mt-4 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
                  >
                    {t("upgrade_to_premium")}
                  </button>
                </div>
              )}
            </>
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
