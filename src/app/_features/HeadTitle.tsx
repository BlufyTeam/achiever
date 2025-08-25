"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DynamicTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      let title;

      // Match /u/[username]/[usermedalid]
      const userMedalMatch = pathname.match(/^\/u\/([^/]+)\/([^/]+)$/);
      // Match /u/[username]
      const usernameMatch = pathname.match(/^\/u\/([^/]+)$/);

      if (userMedalMatch && userMedalMatch[1]) {
        title = userMedalMatch[1]; // just username
      } else if (usernameMatch && usernameMatch[1]) {
        title = usernameMatch[1];
      } else {
        // Default for other pages
        title = pathname === "/" ? "Home" : pathname.replace(/\//g, " ").trim();
      }

      document.title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  }, [pathname]);

  return null;
}
