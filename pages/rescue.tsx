import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useUserStore } from "../store/user";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

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

export default function RescuesPage() {
  const { t } = useTranslation("common");
  const [rescues, setRescues] = useState([]);
  const [icon, setIcon] = useState<any>(null);
  const token = useUserStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      const stored = localStorage.getItem("token");
      if (!stored) return router.push("/login");
    }

    fetch("http://localhost:3001/rescue/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setRescues)
      .catch(() => alert("Error al cargar rescates"));

    if (typeof window !== "undefined") {
      const L = require("leaflet");
      setIcon(
        L.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      );
    }
  }, [token]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t("rescue_list")}</h1>
      <div className="h-[70vh]">
        {icon && (
          <MapContainer
            center={[-34.6, -58.4]}
            zoom={5}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {rescues.map((r: any) => (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={icon}
              >
                <Popup>
                  {r.message || "—"}
                  <br />
                  {t("status")}: {r.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
