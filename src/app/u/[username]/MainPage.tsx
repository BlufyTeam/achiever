"use client";

import { useState, useEffect } from "react";
import {
  BookmarkIcon,
  CircleUserIcon,
  GiftIcon,
  GoalIcon,
  Pencil,
  Settings,
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { useIsMobile } from "../../Utils/useIsMobile";
import EditProfilePage from "./EditProfile";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { useSearchParams } from "next/navigation";
import { MedalIcon, RowsIcon, WarningCircleIcon } from "@phosphor-icons/react";
import UserMedalsGrid from "./UserMedals";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import TrackedMedalsPage from "~/app/_features/TrackedMedalsComponent";
import { useRouter } from "next/navigation";

export default function ProfilePage({ username }: { username: string }) {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(
    "/images/default.png",
  );
  const [wavePath, setWavePath] = useState<string>("");
  console.log(searchParams);
  // Fetch profile user by username
  const {
    data: profileUser,
    isLoading: isProfileUserLoading,
    isError: isProfileUserError,
  } = api.user.getUser.useQuery({ username }, { enabled: !!username });

  // Fetch logged-in user
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    refetch,
  } = api.user.getCurrentUser.useQuery();

  // Determine if the viewer is the profile owner
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (profileUser) {
      setProfileImage(profileUser.image || "/images/default.png");
    }
  }, [profileUser]);

  function generateWavePath(): string {
    const segments = 4;
    const segmentWidth = 1440 / segments;
    const amplitude = 10;
    const baseY = 100;

    let path = `M0,${baseY} `;

    for (let i = 0; i < segments; i++) {
      const x1 = i * segmentWidth + segmentWidth / 3;
      const y1 = baseY + Math.sin(i) * amplitude;

      const x2 = i * segmentWidth + (2 * segmentWidth) / 3;
      const y2 = baseY - Math.sin(i + 0.5) * amplitude;

      const x = (i + 1) * segmentWidth;
      const y = baseY + Math.sin(i + 1) * amplitude;

      path += `C${x1},${y1} ${x2},${y2} ${x},${y} `;
    }

    path += `L1440,0 L0,0 Z`;
    return path;
  }

  useEffect(() => {
    setWavePath(generateWavePath());
  }, []);

  // Show EditProfilePage if mode is "edit" and it's the user's own profile
  if (mode === "edit" && isOwnProfile) {
    return (
      <EditProfilePage
        mode={mode}
        onUpdateSuccess={() => setIsEditOpen(false)}
      />
    );
  }

  // Show loading spinner if fetching user data
  if (isProfileUserLoading || isCurrentUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  // Show error if user not found
  if (isProfileUserError || !profileUser) {
    return (
      <div className="mt-6text-center text-amber-50">
        User not found or error occurred.
      </div>
    );
  }

  return (
    <div>
      {/* Header Area */}
      <div
        className="relative h-full w-full shadow-lg"
        style={{ minHeight: "150px" }}
      >
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:text-gray-800"
          onClick={() => console.log("Settings clicked")}
        >
          <Settings size={24} className="h-5 w-5" />
        </Button>

        <svg
          viewBox="0 0 1440 200"
          className="absolute top-0 left-0 h-60 w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cc933d" />
              <stop offset="100%" stopColor="#f5d39f" />
            </linearGradient>
          </defs>
          <path fill="url(#grad)" d={wavePath} />
        </svg>

        <div className="absolute top-20 left-1/2 flex -translate-x-1/2 flex-col items-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={profileImage}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>

            {isOwnProfile && (
              <Button
                size="icon"
                className="absolute -bottom-2 -left-2 rounded-full bg-white p-1 shadow-md"
                onClick={() => router.push("/u/" + username + "?mode=edit")}
              >
                <Pencil className="h-4 w-4 text-gray-600" />
              </Button>
            )}
          </div>

          <div className="mt-3 text-center">
            <label className="text-lg font-medium text-amber-50">
              {profileUser.name}
            </label>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-4 pt-15">
        <Tabs defaultValue="profile" className="w-full">
          <div className="mt-6 flex justify-center">
            <TabsList className="mb-3 gap-1 bg-transparent text-amber-50">
              <TabsTrigger
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                value="profile"
              >
                <CircleUserIcon size={24}></CircleUserIcon>
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                value="medals"
              >
                <MedalIcon size={24}></MedalIcon>
                Medals
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                value="collections"
              >
                <RowsIcon size={24}></RowsIcon>
                Collections
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                value="tracks"
              >
                <GoalIcon size={24}></GoalIcon>
                Tracks
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                value="gifts"
              >
                <GiftIcon size={24}></GiftIcon>
                Gifts
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="profile">
            <div className="text-center text-gray-400">
              <p>Profile feature coming soon...</p>
            </div>
          </TabsContent>
          <TabsContent value="medals">
            <UserMedalsGrid username={username} />
          </TabsContent>
          <TabsContent value="collections">
            <div className="text-center text-gray-400">
              <p>Collections feature coming soon...</p>
            </div>
          </TabsContent>
          <TabsContent value="tracks">
            <div className="text-center text-gray-400">
              <TrackedMedalsPage></TrackedMedalsPage>
            </div>
          </TabsContent>
          <TabsContent value="gifts">
            <div className="text-center text-gray-400">
              <p>gifts feature coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
