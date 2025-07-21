import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "../store/user";
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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
        () => console.warn("No se pudo obtener ubicación")
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
        const res = await fetch("http://localhost:3001/rescue/my", {
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
        alert("Error al obtener ubicación");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  if (loading) return <p className="p-4">{t("loading_rescues")}</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("rescue_list")}</h1>

      {rescues.length === 0 ? (
        <p className="text-gray-500">{t("no_rescues")}</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {rescues.map((rescue) => (
            <li key={rescue.id} className="p-4 border rounded-xl shadow-sm">
              <p>
                <strong>{t("location")}:</strong> {rescue.latitude},{" "}
                {rescue.longitude}
              </p>
              <p>
                <strong>{t("message")}:</strong> {rescue.message || "—"}
              </p>
              <p>
                <strong>{t("status")}:</strong> {rescue.status}
              </p>
              <p className="text-sm text-gray-500">
                {t("date")}: {new Date(rescue.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-2">{t("request_rescue")}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const storedToken = token || localStorage.getItem("token");
          if (!storedToken) return;

          try {
            const res = await fetch("http://localhost:3001/rescue/request", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${storedToken}`,
              },
              body: JSON.stringify({
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                message,
              }),
            });

            const data = await res.json();
            if (!res.ok) return alert(data.error || "Error");

            setRescues((prev) => [data, ...prev]);
            setLat("");
            setLng("");
            setMessage("");
          } catch {
            alert("Error al conectar");
          }
        }}
        className="space-y-3"
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              required
              placeholder="Latitud"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              step="any"
              required
              placeholder="Longitud"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="button"
            onClick={obtenerUbicacion}
            disabled={locating}
            className="text-sm text-blue-600 underline"
          >
            {locating ? "Obteniendo ubicación…" : t("use_location")}
          </button>
        </div>

        <textarea
          name="message"
          placeholder={t("optional_message")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          {t("send_request")}
        </button>
      </form>

      {(rescues.length > 0 || userLocation) && rescueIcon && (
        <div className="mt-6 h-80 rounded-xl overflow-hidden shadow">
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
                  {t("status")}: {rescue.status}
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
      )}
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
