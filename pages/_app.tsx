import "../styles/globals.css";
import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import Header from "../components/Header";
import { useEffect } from "react";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideHeader = ["/", "/login", "/register"].includes(router.pathname);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <>
      {!hideHeader && <Header />}
      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(MyApp);
