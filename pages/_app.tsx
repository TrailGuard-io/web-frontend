import "../styles/globals.css";
import "leaflet/dist/leaflet.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import Header from "../components/Header";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(MyApp);
