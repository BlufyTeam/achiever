"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export default function TabBar() {
  const pathname = usePathname();

  const activeTab = pathname.includes("/explore")
    ? "tab-2"
    : pathname.includes("/profile")
      ? "tab-3"
      : "tab-1";

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white shadow md:hidden">
      <div className="flex w-full justify-between px-4 py-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <div
                  className={`py-1 ${activeTab === "tab-1" ? "text-primary" : "text-muted-foreground"}`}
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
                  className={`relative py-1 ${activeTab === "tab-2" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <PanelsTopLeftIcon size={26} aria-hidden="true" />
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
              <Link href="/profile">
                <div
                  className={`py-1 ${activeTab === "tab-3" ? "text-primary" : "text-muted-foreground"}`}
                >
                  <BoxIcon size={26} aria-hidden="true" />
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
