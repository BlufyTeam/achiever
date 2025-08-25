"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationMenu from "./_components/navBar/notification-menu";
import { useIsMobile } from "./Utils/useIsMobile";
export default function HomePage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div className="h-full pt-3">
      {isMobile ? (
        <div className="ml-2 flex">
          <NotificationMenu></NotificationMenu>
        </div>
      ) : null}
    </div>
  );
}
