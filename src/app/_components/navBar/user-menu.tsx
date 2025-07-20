"use client";

import { useRouter } from "next/navigation"; // ← for App Router
import { LogOutIcon, Settings, UserPenIcon, ShieldUser } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
type InfoType = {
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
};
export default function UserMenu({ info }: { info: InfoType }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="border-2">
            <AvatarImage
              src={
                info.image && info.image.trim() !== ""
                  ? info.image
                  : "/images/default.png"
              }
              alt="Profile image"
            />
            <AvatarFallback>profile</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">
            {info.name}
          </span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {info.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {info.role == "ADMIN" ? (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <ShieldUser size={16} className="opacity-60" aria-hidden="true" />
              <span>Admin</span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <UserPenIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings size={16} className="opacity-60" aria-hidden="true" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
