"use client";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import UserMenu from "./navBar/user-menu";
import NotificationMenu from "./navBar/notification-menu";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  const pathname = usePathname();
  const {
    data: userData,
    isLoading: isUserLoading,
    status,
  } = api.signup.getCurrentUser.useQuery();
  const [profileImage, setProfileImage] = useState<string>(
    "/images/default.png",
  );

  useEffect(() => {
    if (userData)
      if (userData?.image) {
        setProfileImage(userData?.image);
      }
  }, [userData]);

  return (
    <header className="bg-secondary hidden border-b px-4 md:block md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                {/* Mobile menu icon */}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link) => (
                    <NavigationMenuItem key={link.href} className="w-full">
                      <NavigationMenuLink
                        href={link.href}
                        className="py-1.5"
                        active={pathname === link.href}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>

          {/* Desktop nav */}
          <div className="flex items-center gap-6">
            <a href="/" className="text-primary hover:text-primary/90">
              Logo
            </a>
            <NavigationMenu className="max-md:hidden">
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      className="text-muted-foreground hover:text-primary py-1.5 font-medium"
                      active={pathname === link.href}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {status === "success" && userData ? (
            <>
              <div className="flex items-center gap-2">
                <NotificationMenu />
              </div>
              <UserMenu info={userData} />
            </>
          ) : status === "pending" ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full border-2" />
              <Skeleton className="h-8 w-20 rounded-md border-2" />
            </>
          ) : (
            // 💡 Loading state
            <>
              <Button asChild variant="ghost" size="sm" className="text-sm">
                <a href="/login">Login</a>
              </Button>
              <Button asChild size="sm" className="text-sm">
                <a href="/signup">Sign Up</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
