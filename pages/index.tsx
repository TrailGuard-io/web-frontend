import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>TrailGuard - Asistencia Off-Road</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white px-4">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="TrailGuard Logo"
            width={256}
            height={256}
            priority
            className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto"
          />
          <h1 className="text-4xl font-extrabold mt-4">TrailGuard</h1>
          <p className="text-lg text-gray-300 mt-2 max-w-xl">
            {t("welcome_main")}
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-lg shadow"
        >
          {t("login_button")}
        </button>
      </main>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
