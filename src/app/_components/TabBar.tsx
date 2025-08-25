"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Medal, HouseIcon, CircleUserRound } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

export default function TabBar() {
  const pathname = usePathname();
  const { data: userData, isLoading: isUserLoading } =
    api.user.getCurrentUser.useQuery();

  const [profileHref, setProfileHref] = useState("/");

  useEffect(() => {
    if (userData?.username) {
      setProfileHref(`/u/${userData.username}`);
    } else {
      // Fallback to a static /profile URL if user is not logged in
      setProfileHref("/login");
    }
  }, [userData]);

  const activeTab = pathname.includes("/explore")
    ? "explore"
    : pathname.includes(profileHref)
      ? "profile"
      : "home";

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white shadow md:hidden">
      <div className="flex w-full justify-between px-4 py-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <div
                  className={`py-1 ${activeTab === "home" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <HouseIcon size={26} aria-hidden="true" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/explore">
                <div
                  className={`relative py-1 ${activeTab === "explore" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Medal size={26} aria-hidden="true" />
                  <Badge className="absolute -top-2 left-full -translate-x-1/2 px-1 text-[10px]">
                    3
                  </Badge>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Explore</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={profileHref}>
                <div
                  className={`py-1 ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <CircleUserRound size={26} aria-hidden="true" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Profile</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
