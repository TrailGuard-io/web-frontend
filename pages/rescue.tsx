import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useUserStore } from "../store/user";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
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
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), {
  ssr: false,
});
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);
const MapEvents = dynamic(() => import("../components/MapEvents"), { ssr: false });

export default function RescuesPage() {
  const { t } = useTranslation("common");
  const [rescues, setRescues] = useState([]);
  const [icon, setIcon] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [vehicleType, setVehicleType] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [terrainType, setTerrainType] = useState("");
  const [problemType, setProblemType] = useState("");
  const [assistanceStatus, setAssistanceStatus] = useState("");
  const [assistanceChannel, setAssistanceChannel] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.6, -58.4]);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hotZoneActive, setHotZoneActive] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const lastBoundsRef = useRef<string | null>(null);
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const L = require("leaflet");
    setIcon(
      L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapZoom(13);
        setMapKey((prev) => prev + 1);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    if (!token) setToken(storedToken);

    if (!mapBounds) return;

    const params = new URLSearchParams();

    if (vehicleType) params.set("vehicleType", vehicleType);
    if (drivetrain) params.set("drivetrain", drivetrain);
    if (terrainType) params.set("terrainType", terrainType);
    if (problemType) params.set("problemType", problemType);
    if (assistanceStatus) params.set("assistanceStatus", assistanceStatus);
    if (assistanceChannel) params.set("assistanceChannel", assistanceChannel);

    if (filter !== "all") {
      const now = new Date();
      const from =
        filter === "today"
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      params.set("from", from.toISOString());
    }

    if (mapBounds) {
      params.set("minLat", mapBounds.minLat.toString());
      params.set("maxLat", mapBounds.maxLat.toString());
      params.set("minLng", mapBounds.minLng.toString());
      params.set("maxLng", mapBounds.maxLng.toString());
    }

    params.set("limit", "500");

    const url =
      params.toString().length > 0
        ? `${API_BASE_URL}/api/rescue/all?${params.toString()}`
        : `${API_BASE_URL}/api/rescue/all`;

    fetch(url, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRescues(data);
          return;
        }
        console.error("Respuesta inválida de rescates:", data);
        setRescues([]);
      })
      .catch(() => alert(t("error_loading_rescues")));
  }, [
    token,
    setToken,
    filter,
    vehicleType,
    drivetrain,
    terrainType,
    problemType,
    assistanceStatus,
    assistanceChannel,
    mapBounds,
    router,
  ]);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken || !mapBounds) return;

    const params = new URLSearchParams();
    if (vehicleType) params.set("vehicleType", vehicleType);
    if (drivetrain) params.set("drivetrain", drivetrain);
    if (terrainType) params.set("terrainType", terrainType);
    if (problemType) params.set("problemType", problemType);
    if (assistanceStatus) params.set("assistanceStatus", assistanceStatus);
    if (assistanceChannel) params.set("assistanceChannel", assistanceChannel);

    if (filter !== "all") {
      const now = new Date();
      const from =
        filter === "today"
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      params.set("from", from.toISOString());
    }

    params.set("minLat", mapBounds.minLat.toString());
    params.set("maxLat", mapBounds.maxLat.toString());
    params.set("minLng", mapBounds.minLng.toString());
    params.set("maxLng", mapBounds.maxLng.toString());
    params.set("limit", "500");

    const url = `${API_BASE_URL}/api/rescue/stream?${params.toString()}`;

    const abortController = new AbortController();
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const startStream = async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${storedToken}` },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(t("stream_open_failed"));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            if (chunk.startsWith(":")) continue;
            const lines = chunk.split("\n");
            let dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith("data:")) {
                dataLines.push(line.replace("data:", "").trim());
              }
            }

            if (dataLines.length === 0) continue;
            const dataStr = dataLines.join("\n");

            try {
              const payload = JSON.parse(dataStr);
              if (!payload?.rescue?.id) continue;

              setRescues((prev) => {
                const next = new Map(prev.map((r: any) => [r.id, r]));
                const existing = next.get(payload.rescue.id) || {};
                next.set(payload.rescue.id, { ...existing, ...payload.rescue });
                return Array.from(next.values()).sort((a: any, b: any) => {
                  const aTime = new Date(a.createdAt || 0).getTime();
                  const bTime = new Date(b.createdAt || 0).getTime();
                  return bTime - aTime;
                });
              });
            } catch {
              // ignore malformed payloads
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          retryTimer = setTimeout(startStream, 3000);
        }
      }
    };

    startStream();

    return () => {
      cancelled = true;
      abortController.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    token,
    filter,
    vehicleType,
    drivetrain,
    terrainType,
    problemType,
    assistanceStatus,
    assistanceChannel,
    mapBounds,
  ]);

  const handleBoundsChange = useCallback((bounds: any) => {
    if (!bounds) return;
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const nextBounds = {
      minLat: southWest.lat,
      maxLat: northEast.lat,
      minLng: southWest.lng,
      maxLng: northEast.lng,
    };

    const key = [
      nextBounds.minLat.toFixed(5),
      nextBounds.maxLat.toFixed(5),
      nextBounds.minLng.toFixed(5),
      nextBounds.maxLng.toFixed(5),
    ].join("|");

    if (lastBoundsRef.current === key) return;
    lastBoundsRef.current = key;
    setMapBounds(nextBounds);
  }, []);

  const formatRescueStatus = (value?: string | null) =>
    value ? t(`rescue_status_${value}`, { defaultValue: value }) : "";

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "5");
      if (process.env.NEXT_PUBLIC_NOMINATIM_EMAIL) {
        url.searchParams.set("email", process.env.NEXT_PUBLIC_NOMINATIM_EMAIL);
      }
      const response = await fetch(url.toString(), {
        headers: { "Accept-Language": "es,en" },
      });
      if (!response.ok) throw new Error("search_failed");
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
      setSearchOpen(true);
    } catch (err) {
      setSearchError(t("search_failed"));
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSearchResult = (result: { lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    setMapCenter([lat, lon]);
    setMapZoom(14);
    setMapKey((prev) => prev + 1);
    setSearchOpen(false);
  };

  const filteredRescues = useMemo(() => {
    if (filter === "all") return rescues;
    const now = new Date();
    return rescues.filter((r: any) => {
      if (!r.createdAt) return true;
      const created = new Date(r.createdAt);
      if (Number.isNaN(created.getTime())) return true;
      if (filter === "today") {
        return created.toDateString() === now.toDateString();
      }
      const diff = now.getTime() - created.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
  }, [filter, rescues]);

  const hotZone = useMemo(() => {
    if (!filteredRescues.length) return null;
    const buckets = new Map<string, { lat: number; lng: number; count: number }>();
    filteredRescues.forEach((r: any) => {
      if (typeof r.latitude !== "number" || typeof r.longitude !== "number") return;
      const latKey = Math.round(r.latitude * 100) / 100;
      const lngKey = Math.round(r.longitude * 100) / 100;
      const key = `${latKey},${lngKey}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(key, { lat: latKey, lng: lngKey, count: 1 });
      }
    });
    let top: { lat: number; lng: number; count: number } | null = null;
    buckets.forEach((value) => {
      if (!top || value.count > top.count) top = value;
    });
    return top;
  }, [filteredRescues]);

  const handleHotZone = () => {
    if (!hotZone) {
      setHotZoneActive(false);
      return;
    }
    const nextActive = !hotZoneActive;
    setHotZoneActive(nextActive);
    if (nextActive) {
      setMapCenter([hotZone.lat, hotZone.lng]);
      setMapZoom(12);
      setMapKey((prev) => prev + 1);
    }
  };

  const recentRescues = useMemo(() => {
    return [...filteredRescues]
      .sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [filteredRescues]);

  const sidebarContent = (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-5 shadow-card backdrop-blur">
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
            <p className="font-display text-lg font-semibold text-ink">TrailGuard</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("filter_reports")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "today", "week"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  filter === option
                    ? "bg-ink text-white shadow-pill"
                    : "bg-white text-ink hover:-translate-y-0.5"
                }`}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-5 shadow-card backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {t("incident_details")}
        </p>
        <div className="mt-3 grid gap-3">
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

      <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-5 shadow-card backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
          {t("helper_status")}
        </p>
        <div className="mt-3 grid gap-3">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[24px] border border-slate-100/80 bg-white/90 p-4 text-center shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("cases")}
          </p>
          <p className="mt-3 text-3xl font-semibold text-ink">{filteredRescues.length}</p>
        </div>
        <div className="rounded-[24px] border border-red-100 bg-red-50/80 p-4 text-center shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400">{t("alerts")}</p>
          <div className="mt-3 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-5 shadow-card backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("recent_alerts")}
        </div>

        <div className="mt-4 space-y-3">
          {recentRescues.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("no_recent_alerts")}</p>
          ) : (
            recentRescues.map((rescue: any) => (
              <div
                key={rescue.id}
                className="rounded-2xl border border-slate-100/80 bg-white px-3 py-2 text-sm text-ink-muted"
              >
                <p className="font-semibold text-ink">
                  {rescue.message || t("alert_logged")}
                </p>
                <p className="text-xs text-ink-muted">
                  {rescue.latitude?.toFixed?.(3)}, {rescue.longitude?.toFixed?.(3)}
                </p>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-5 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink shadow-pill transition hover:-translate-y-0.5"
        >
          {t("back_home")}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-ink-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        {t("syncing")}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[360px_1fr]">
        <aside className="hidden min-h-screen border-r border-slate-200/70 bg-white/40 p-6 lg:block">
          {sidebarContent}
        </aside>

        <main className="relative min-h-screen">
          <div className="absolute inset-0">
            {icon && (
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={mapZoom}
                zoomControl={false}
                className="h-full w-full"
              >
                <MapEvents onBoundsChange={handleBoundsChange} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="bottomright" />
                {hotZoneActive && hotZone && (
                  <Circle
                    center={[hotZone.lat, hotZone.lng]}
                    radius={2000}
                    pathOptions={{ color: "#ef4444", fillColor: "#fecaca", fillOpacity: 0.35 }}
                  />
                )}
                {filteredRescues.map((r: any) => (
                  <Marker
                    key={r.id}
                    position={[r.latitude, r.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      {r.message || "—"}
                      <br />
                      {t("status")}: {formatRescueStatus(r.status)}
                      {r.problemType && (
                        <>
                          <br />
                          {t("problem_type")}: {t(`problem_${r.problemType}`)}
                        </>
                      )}
                      {r.vehicleType && (
                        <>
                          <br />
                          {t("vehicle_type")}: {t(`vehicle_${r.vehicleType}`)}
                        </>
                      )}
                      {r.assistanceStatus && (
                        <>
                          <br />
                          {t("assistance_status")}:{" "}
                          {t(`assistance_status_${r.assistanceStatus}`)}
                        </>
                      )}
                      {r.assistanceProvider && (
                        <>
                          <br />
                          {t("assistance_provider")}: {r.assistanceProvider}
                        </>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-20 z-[500] flex items-center gap-3 p-4 md:top-24">
            <button
              onClick={() => setPanelOpen(true)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white shadow-pill lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="pointer-events-auto relative flex flex-1 items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-card backdrop-blur">
              <svg className="h-5 w-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 12.65z" />
              </svg>
              <input
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                placeholder={`${t("search_placeholder")}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                onFocus={() => {
                  if (searchResults.length) setSearchOpen(true);
                }}
              />
              <button
                type="button"
                onClick={runSearch}
                className="rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white shadow-pill"
              >
                {searchLoading ? "..." : t("search")}
              </button>
              {(searchLoading || searchOpen || searchError) && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 rounded-2xl border border-slate-100 bg-white p-2 shadow-card">
                  {searchLoading && (
                    <p className="px-3 py-2 text-xs text-ink-muted">{t("search_loading")}</p>
                  )}
                  {searchError && (
                    <p className="px-3 py-2 text-xs text-rose-500">{searchError}</p>
                  )}
                  {!searchLoading && !searchError && searchResults.length === 0 && (
                    <p className="px-3 py-2 text-xs text-ink-muted">{t("search_empty")}</p>
                  )}
                  {!searchLoading && !searchError && searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.lat}-${result.lon}`}
                          className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs text-ink hover:bg-slate-50"
                          onClick={() => selectSearchResult(result)}
                        >
                          <span className="mt-0.5 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                          <span>{result.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleHotZone}
              disabled={!hotZone}
              className={`pointer-events-auto hidden items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-card backdrop-blur md:flex ${
                hotZoneActive
                  ? "bg-ink text-white"
                  : "bg-white/90 text-ink"
              }`}
            >
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.134 4.4 6 7.8 6 11c0 3.314 2.686 6 6 6s6-2.686 6-6c0-3.2-2.134-6.6-6-9z" />
              </svg>
              {hotZone ? t("hot_zone") : t("hot_zone_unavailable")}
            </button>
          </div>

          <div className="absolute bottom-6 right-6 z-[500] flex flex-col gap-3">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-pill"
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (pos) => {
                    setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                    setMapZoom(13);
                    setMapKey((prev) => prev + 1);
                  },
                  () => undefined
                );
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2m13.657-5.657l-2.828 2.828M9.171 14.828l-2.828 2.828m0-11.314l2.828 2.828m5.657 5.657l2.828 2.828" />
              </svg>
            </button>
            <button
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white shadow-pill"
              onClick={() => router.push("/dashboard")}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </main>

        {panelOpen && (
          <div className="fixed inset-0 z-[600] flex lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setPanelOpen(false)}
            />
            <div className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-white/90 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    {t("panel")}
                  </p>
                  <p className="font-display text-lg font-semibold text-ink">{t("alerts")}</p>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-pill"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6">{sidebarContent}</div>
            </div>
          </div>
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
