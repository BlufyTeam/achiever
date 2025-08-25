"use client";

import "~/styles/globals.css";
import localFont from "next/font/local";
import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "~/app/providers";
import { usePathname } from "next/navigation";
import DynamicTitle from "./_features/HeadTitle";
import NavBar from "./_components/NavBar";
import TabBar from "./_components/TabBar";

const iranSans = localFont({
  src: [
    {
      path: "../../public/fonts/IRANSansXFaNum-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansXFaNum-Bold.woff",
      weight: "700",
      style: "normal",
    },
    // ... other fonts
  ],
  variable: "--font-iransans",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideBars = pathname === "/login" || pathname === "/signup";

  return (
    <html
      lang="fa"
      className={`${iranSans.variable} font-iransans min-h-screen`}
    >
      <body className="scrollbar-track-[var(--accent)] bg-background-gradient relative h-full">
        <Providers>
          <div id="overlay"></div>
          <div id="portal" style={{ overflow: "hidden" }}></div>
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
            {!hideBars && <NavBar />}
            {!hideBars && <TabBar />}
            <main className="h-full min-h-[calc(100vh-120px)]">
              <DynamicTitle />
              {children}
            </main>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
