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
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), {
  ssr: false,
});
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);
const ZoomControl = dynamic(
  () => import("react-leaflet").then((mod) => mod.ZoomControl),
  { ssr: false }
);
const MapEvents = dynamic(() => import("../components/MapEvents"), { ssr: false });

const DEFAULT_CENTER: [number, number] = [-38.0055, -57.5426];

interface RescueRecord {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  message?: string | null;
  status: string;
  problemType?: string | null;
  vehicleType?: string | null;
  assistanceStatus?: string | null;
  assistanceProvider?: string | null;
  assignedRescuerId?: number | null;
  assignedTeamId?: number | null;
  rescuerLatitude?: number | null;
  rescuerLongitude?: number | null;
  rescuerUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TeamOption {
  id: number;
  name: string;
  avatar?: string | null;
}

interface RescueCandidate {
  id: number;
  status: string;
  user?: {
    id: number;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  team?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

interface RescueMessage {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
}

const toRad = (value: number) => (value * Math.PI) / 180;
const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

export default function RescuesPage() {
  const { t } = useTranslation("common");
  const [rescues, setRescues] = useState<RescueRecord[]>([]);
  const [icon, setIcon] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "resolved" | "all">(
    "active"
  );
  const [vehicleType, setVehicleType] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [terrainType, setTerrainType] = useState("");
  const [problemType, setProblemType] = useState("");
  const [assistanceStatus, setAssistanceStatus] = useState("");
  const [assistanceChannel, setAssistanceChannel] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedRescueId, setSelectedRescueId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<RescueCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [assigningCandidateId, setAssigningCandidateId] = useState<number | null>(null);
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamCandidateId, setTeamCandidateId] = useState("");
  const [messages, setMessages] = useState<RescueMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationWatchRef = useRef<number | null>(null);
  const lastLocationSentRef = useRef<number>(0);
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
    if (!storedToken) return;

    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setCurrentUserId(data.id);
      })
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    fetch(`${API_BASE_URL}/api/teams/mine`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeamOptions(
            data.map((team) => ({
              id: team.id,
              name: team.name,
              avatar: team.avatar ?? null,
            }))
          );
        } else {
          setTeamOptions([]);
        }
      })
      .catch(() => setTeamOptions([]));
  }, [token]);

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

    if (statusFilter === "resolved") {
      params.set("status", "resolved");
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
    statusFilter,
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

    if (statusFilter === "resolved") {
      params.set("status", "resolved");
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
    statusFilter,
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

  const selectedRescue = useMemo(
    () => rescues.find((rescue) => rescue.id === selectedRescueId) || null,
    [rescues, selectedRescueId]
  );

  const myTeamIds = useMemo(
    () => new Set(teamOptions.map((team) => team.id)),
    [teamOptions]
  );

  const isOwner = selectedRescue?.userId === currentUserId;
  const isAssignedUser = selectedRescue?.assignedRescuerId === currentUserId;
  const isAssignedTeamMember = Boolean(
    selectedRescue?.assignedTeamId && myTeamIds.has(selectedRescue.assignedTeamId)
  );
  const canChat =
    Boolean(selectedRescue?.assignedRescuerId || selectedRescue?.assignedTeamId) &&
    Boolean(isOwner || isAssignedUser || isAssignedTeamMember);
  const canShareLocation = Boolean(isAssignedUser || isAssignedTeamMember);

  const myCandidate = useMemo(() => {
    if (!currentUserId) return null;
    return (
      candidates.find((candidate) => candidate.user?.id === currentUserId) ||
      candidates.find((candidate) =>
        candidate.team?.id ? myTeamIds.has(candidate.team.id) : false
      ) ||
      null
    );
  }, [candidates, currentUserId, myTeamIds]);

  const acceptedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.status === "accepted") || null,
    [candidates]
  );

  const rescuerDistanceKm = useMemo(() => {
    if (
      !selectedRescue ||
      selectedRescue.rescuerLatitude == null ||
      selectedRescue.rescuerLongitude == null
    ) {
      return null;
    }
    return distanceKm(
      selectedRescue.latitude,
      selectedRescue.longitude,
      selectedRescue.rescuerLatitude,
      selectedRescue.rescuerLongitude
    );
  }, [selectedRescue]);

  const rescueOpenForCandidates = Boolean(
    selectedRescue &&
      selectedRescue.status === "pending" &&
      !selectedRescue.assignedRescuerId &&
      !selectedRescue.assignedTeamId
  );

  const formatRescueStatus = (value?: string | null) =>
    value ? t(`rescue_status_${value}`, { defaultValue: value }) : "";

  const fetchCandidates = useCallback(async () => {
    if (!selectedRescueId) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;
    setLoadingCandidates(true);
    setCandidateError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/candidates`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setCandidateError(error.error || t("error"));
        setCandidates([]);
        return;
      }
      const data = await response.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      setCandidateError(t("connection_error"));
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedRescueId, token, t]);

  const fetchMessages = useCallback(async () => {
    if (!selectedRescueId || !canChat) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;
    setMessagesLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/messages`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      if (!response.ok) {
        setMessages([]);
        return;
      }
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedRescueId, token, canChat]);

  useEffect(() => {
    if (!selectedRescueId) {
      setCandidates([]);
      setMessages([]);
      return;
    }
    fetchCandidates();
  }, [
    selectedRescueId,
    selectedRescue?.status,
    selectedRescue?.assignedRescuerId,
    selectedRescue?.assignedTeamId,
    fetchCandidates,
  ]);

  useEffect(() => {
    if (!selectedRescueId || !canChat) {
      setMessages([]);
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedRescueId, canChat, fetchMessages]);

  useEffect(() => {
    if (!sharingLocation || !selectedRescueId || !canShareLocation) {
      if (locationWatchRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation?.clearWatch(locationWatchRef.current);
      }
      locationWatchRef.current = null;
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSharingLocation(false);
      return;
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      setSharingLocation(false);
      return;
    }

    locationWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastLocationSentRef.current < 5000) return;
        lastLocationSentRef.current = now;
        try {
          await fetch(`${API_BASE_URL}/api/rescue/${selectedRescueId}/location`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${storedToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
        } catch {
          // ignore
        }
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation?.clearWatch(locationWatchRef.current);
      }
      locationWatchRef.current = null;
    };
  }, [sharingLocation, selectedRescueId, canShareLocation, token]);

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

  const handleCandidate = async (teamId?: number) => {
    if (!selectedRescueId) return;
    if (!rescueOpenForCandidates) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setCandidateSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/candidates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamId ? { teamId } : {}),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || t("error"));
        return;
      }
      await fetchCandidates();
    } catch {
      alert(t("connection_error"));
    } finally {
      setCandidateSubmitting(false);
    }
  };

  const handleAssignCandidate = async (candidateId: number) => {
    if (!selectedRescueId) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setAssigningCandidateId(candidateId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/assign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ candidateId }),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || t("error"));
        return;
      }
      const data = await response.json();
      if (data?.rescue?.id) {
        setRescues((prev) =>
          prev.map((rescue) =>
            rescue.id === data.rescue.id ? { ...rescue, ...data.rescue } : rescue
          )
        );
      }
      await fetchCandidates();
    } catch {
      alert(t("connection_error"));
    } finally {
      setAssigningCandidateId(null);
    }
  };

  const handleRejectCandidate = async (candidateId: number) => {
    if (!selectedRescueId) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setAssigningCandidateId(candidateId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/candidates/${candidateId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${storedToken}` },
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || t("error"));
        return;
      }
      await fetchCandidates();
    } catch {
      alert(t("connection_error"));
    } finally {
      setAssigningCandidateId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRescueId) return;
    if (!messageText.trim()) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setSendingMessage(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/rescue/${selectedRescueId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: messageText.trim() }),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || t("error"));
        return;
      }
      const data = await response.json();
      setMessages((prev) => [...prev, data]);
      setMessageText("");
    } catch {
      alert(t("connection_error"));
    } finally {
      setSendingMessage(false);
    }
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

  const activeRescues = useMemo(
    () => filteredRescues.filter((r: any) => r.status !== "resolved"),
    [filteredRescues]
  );

  const visibleRescues = useMemo(() => {
    if (statusFilter === "resolved") {
      return filteredRescues.filter((r: any) => r.status === "resolved");
    }
    if (statusFilter === "all") {
      return filteredRescues;
    }
    return activeRescues;
  }, [statusFilter, filteredRescues, activeRescues]);

  const hotZone = useMemo(() => {
    if (!visibleRescues.length) return null;
    const buckets = new Map<string, { lat: number; lng: number; count: number }>();
    visibleRescues.forEach((r: any) => {
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
  }, [visibleRescues]);

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
    return [...visibleRescues]
      .sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [visibleRescues]);

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

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("filter_status")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["active", "resolved", "all"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  statusFilter === option
                    ? "bg-ink text-white shadow-pill"
                    : "bg-white text-ink hover:-translate-y-0.5"
                }`}
              >
                {option === "resolved"
                  ? t("rescue_status_resolved")
                  : option === "active"
                  ? t("active")
                  : t("all")}
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
          <p className="mt-3 text-3xl font-semibold text-ink">{visibleRescues.length}</p>
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
              <button
                key={rescue.id}
                type="button"
                onClick={() => {
                  setSelectedRescueId(rescue.id);
                  setMapCenter([rescue.latitude, rescue.longitude]);
                  setMapZoom(13);
                  setMapKey((prev) => prev + 1);
                }}
                className="w-full rounded-2xl border border-slate-100/80 bg-white px-3 py-2 text-left text-sm text-ink-muted transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <p className="font-semibold text-ink">
                  {rescue.message || t("alert_logged")}
                </p>
                <p className="text-xs text-ink-muted">
                  {rescue.latitude?.toFixed?.(3)}, {rescue.longitude?.toFixed?.(3)}
                </p>
              </button>
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

  const selectedRescuePanel = selectedRescue ? (
    <div className="pointer-events-auto absolute left-4 right-4 top-24 z-[550] max-h-[70vh] overflow-y-auto rounded-[28px] border border-slate-100/80 bg-white/95 p-4 shadow-card backdrop-blur sm:left-auto sm:right-6 sm:top-28 sm:w-[360px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
            {t("selected_rescue")}
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-7-4.35-7-11a7 7 0 1114 0c0 6.65-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" fill="currentColor" />
            </svg>
            #{selectedRescue.id}
          </div>
        </div>
        <button
          onClick={() => setSelectedRescueId(null)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-ink"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm text-ink-muted">
        <p>
          <span className="font-semibold text-ink">{t("status")}: </span>
          {formatRescueStatus(selectedRescue.status)}
        </p>
        <p>
          <span className="font-semibold text-ink">{t("location")}: </span>
          {selectedRescue.latitude.toFixed(4)}, {selectedRescue.longitude.toFixed(4)}
        </p>
        <p>
          <span className="font-semibold text-ink">{t("message")}: </span>
          {selectedRescue.message || "—"}
        </p>
      </div>

      {rescuerDistanceKm !== null && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm text-ink">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("distance_to_rescuer")}
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {rescuerDistanceKm.toFixed(1)} km
          </p>
        </div>
      )}

      {(selectedRescue.assignedRescuerId || selectedRescue.assignedTeamId) && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">
            {t("assigned_rescuer")}
          </p>
          <p className="mt-1 font-semibold text-emerald-700">
            {acceptedCandidate?.team?.name ||
              acceptedCandidate?.user?.name ||
              acceptedCandidate?.user?.email ||
              (selectedRescue.assignedTeamId
                ? `${t("assigned_team")} #${selectedRescue.assignedTeamId}`
                : `${t("assigned_rescuer")} #${selectedRescue.assignedRescuerId}`)}
          </p>
        </div>
      )}

      {!selectedRescue.assignedRescuerId &&
        !selectedRescue.assignedTeamId &&
        !isOwner && (
          <div className="mt-4 space-y-3">
            {myCandidate ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-ink">
                <p className="font-semibold text-ink">{t("rescue_candidates")}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t(`candidate_status_${myCandidate.status}`, {
                    defaultValue: myCandidate.status,
                  })}
                </p>
                {myCandidate.status === "pending" && (
                  <p className="mt-2 text-xs text-ink-muted">
                    {t("chat_pending_accept")}
                  </p>
                )}
              </div>
            ) : rescueOpenForCandidates ? (
              <>
                <button
                  onClick={() => handleCandidate()}
                  disabled={candidateSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                  {candidateSubmitting ? t("processing") : t("candidate_as_rescuer")}
                </button>

                {teamOptions.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                      {t("teams")}
                    </label>
                    <select
                      value={teamCandidateId}
                      onChange={(e) => setTeamCandidateId(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink"
                    >
                      <option value="">{t("select_option")}</option>
                      {teamOptions.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!teamCandidateId) return;
                        handleCandidate(Number(teamCandidateId));
                      }}
                      disabled={candidateSubmitting || !teamCandidateId}
                      className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {candidateSubmitting ? t("processing") : t("candidate_as_team")}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-ink">
                <p className="font-semibold text-ink">{t("rescue_unavailable")}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {selectedRescue.status === "resolved"
                    ? t("rescue_resolved")
                    : t("rescue_assigned")}
                </p>
              </div>
            )}
          </div>
        )}

      {isOwner && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("rescue_candidates")}
          </p>
          {candidateError && (
            <p className="mt-2 text-xs text-rose-500">{candidateError}</p>
          )}
          {loadingCandidates ? (
            <p className="mt-2 text-sm text-ink-muted">{t("loading")}</p>
          ) : candidates.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">{t("no_candidates")}</p>
          ) : (
            <div className="mt-3 space-y-2">
            {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs text-ink-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {candidate.user?.avatar ? (
                          <img
                            src={candidate.user.avatar}
                            alt={candidate.user?.name || candidate.user?.email || "Avatar"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink">
                            {candidate.team ? (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11a4 4 0 118 0v1h2a2 2 0 012 2v4H2v-4a2 2 0 012-2h2v-1z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zm6 8a6 6 0 00-12 0" />
                              </svg>
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">
                            {candidate.team?.name ||
                              candidate.user?.name ||
                              candidate.user?.email ||
                              `#${candidate.id}`}
                          </p>
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t(`candidate_status_${candidate.status}`, {
                              defaultValue: candidate.status,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {!selectedRescue.assignedRescuerId &&
                      !selectedRescue.assignedTeamId &&
                      candidate.status === "pending" && (
                        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                          <button
                            onClick={() => handleAssignCandidate(candidate.id)}
                            disabled={assigningCandidateId === candidate.id}
                            className="flex items-center justify-center gap-1 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {assigningCandidateId === candidate.id
                              ? t("processing")
                              : t("accept_candidate")}
                          </button>
                          <button
                            onClick={() => handleRejectCandidate(candidate.id)}
                            disabled={assigningCandidateId === candidate.id}
                            className="flex items-center justify-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold text-white"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t("reject_candidate")}
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canShareLocation && (
        <button
          onClick={() => setSharingLocation((prev) => !prev)}
          className={`mt-5 w-full rounded-full px-4 py-2 text-sm font-semibold shadow-pill transition ${
            sharingLocation
              ? "bg-slate-900 text-white"
              : "bg-white text-ink"
          }`}
        >
          {sharingLocation ? t("stop_sharing") : t("share_location")}
        </button>
      )}

      {canChat && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("private_chat")}
          </p>
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
            {messagesLoading ? (
              <p className="text-ink-muted">{t("loading")}</p>
            ) : messages.length === 0 ? (
              <p className="text-ink-muted">{t("no_messages")}</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`w-fit max-w-[90%] rounded-2xl px-3 py-2 ${
                    msg.author?.id === currentUserId
                      ? "ml-auto bg-ink text-white"
                      : "bg-slate-100 text-ink"
                  }`}
                >
                  <p className="text-[11px] font-semibold">
                    {msg.author?.name || msg.author?.email || "—"}
                  </p>
                  <p>{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t("chat_placeholder")}
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white shadow-pill disabled:opacity-60"
            >
              {sendingMessage ? "..." : t("send_message")}
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="h-screen">
      <div className="relative h-screen lg:grid lg:grid-cols-[360px_1fr]">
        <aside className="hidden h-screen overflow-y-auto border-r border-slate-200/70 bg-white/40 p-6 lg:block">
          {sidebarContent}
        </aside>

        <main className="relative h-screen overflow-hidden">
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
                <ZoomControl position="bottomleft" />
                {hotZoneActive && hotZone && (
                  <Circle
                    center={[hotZone.lat, hotZone.lng]}
                    radius={2000}
                    pathOptions={{ color: "#ef4444", fillColor: "#fecaca", fillOpacity: 0.35 }}
                  />
                )}
                {visibleRescues.map((r: any) => (
                  <Marker
                    key={r.id}
                    position={[r.latitude, r.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => setSelectedRescueId(r.id),
                    }}
                  >
                  </Marker>
                ))}
                {selectedRescue && (
                  <Circle
                    center={[selectedRescue.latitude, selectedRescue.longitude]}
                    radius={140}
                    pathOptions={{ color: "#f97316", fillColor: "#fed7aa", fillOpacity: 0.35 }}
                  />
                )}
                {selectedRescue &&
                  selectedRescue.rescuerLatitude != null &&
                  selectedRescue.rescuerLongitude != null && (
                    <>
                      <Polyline
                        positions={[
                          [selectedRescue.rescuerLatitude, selectedRescue.rescuerLongitude],
                          [selectedRescue.latitude, selectedRescue.longitude],
                        ]}
                        pathOptions={{ color: "#0ea5e9", weight: 3, dashArray: "6 6" }}
                      />
                      <CircleMarker
                        center={[
                          selectedRescue.rescuerLatitude,
                          selectedRescue.rescuerLongitude,
                        ]}
                        radius={8}
                        pathOptions={{ color: "#0ea5e9", fillColor: "#38bdf8", fillOpacity: 0.9 }}
                      />
                    </>
                )}
              </MapContainer>
            )}
          </div>

          {selectedRescuePanel}

          <div className="pointer-events-none absolute left-0 right-0 top-6 z-[500] flex items-center gap-3 p-4">
            <button
              onClick={() => setPanelOpen(true)}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white shadow-pill lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="pointer-events-auto flex flex-1 items-center justify-center">
              <div className="relative flex w-full max-w-4xl items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-card backdrop-blur">
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
