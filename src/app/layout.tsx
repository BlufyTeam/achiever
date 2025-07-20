import "~/styles/globals.css";

import localFont from "next/font/local";
import { TRPCReactProvider } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Providers } from "~/app/providers";
import type { Metadata } from "next";
import NavBar from "./_components/NavBar";
import TabBar from "./_components/TabBar";

export const metadata: Metadata = {
  title: "Achiever",
  description: "Achiever",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
const iranSans = localFont({
  src: [
    {
      path: "../../public/fonts/IRANSansXFaNum-Thin.woff",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-UltraLight.woff",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-DemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-ExtraBold.woff",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-iransans",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="fa"
      className={`${iranSans.variable} font-iransans min-h-screen`}
    >
      {/* <Script src="https://unpkg.com/react-scan/dist/auto.global.js" /> */}

      <body className="scrollbar-track-[var(--accent)] bg-background-gradient relative">
        {/* <DatabaseStatus /> */}
        <Providers>
          <div id="overlay"></div>
          <div
            id="portal"
            style={{
              overflow: "hidden",
            }}
          ></div>
          <div
            id="user-nav"
            style={{
              position: "fixed",
              bottom: "0px",
              width: "100%",
              padding: "5px 0px",
              zIndex: "1000",
            }}
          ></div>
          <div id="toast"></div>

          <TRPCReactProvider>
            <NavBar></NavBar>
            <TabBar></TabBar>

            <main className="min-h-[calc(100vh-120px)]">{children}</main>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
