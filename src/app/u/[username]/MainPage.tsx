"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
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
import ReceivedGiftsPage from "~/app/_features/GiftsComponent";
import PullToRefreshClientProvider from "~/app/Utils/ClientRefreshProvider";

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
  const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false);
  const [isFollowingDialogOpen, setIsFollowingDialogOpen] = useState(false);

  // Use a ref to store the observer for cleanup
  const followersObserver = useRef<IntersectionObserver | null>(null);
  const followingObserver = useRef<IntersectionObserver | null>(null);

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

  // Fetch follow status
  const { data: followStatus, refetch: refetchFollowStatus } =
    api.follow.isFollowing.useQuery(
      { userId: profileUser?.id || "" },
      {
        enabled:
          !!profileUser?.id &&
          !!currentUser &&
          currentUser.username !== username,
      },
    );

  // Fetch followers with infinite scrolling
  const {
    data: followersData,
    fetchNextPage: fetchNextFollowersPage,
    hasNextPage: hasNextFollowersPage,
    isLoading: areFollowersLoading,
    isFetchingNextPage: isFetchingMoreFollowers,
    refetch: refetchFollowers,
  } = api.follow.getFollowers.useInfiniteQuery(
    { userId: profileUser?.id || "" },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined,
      enabled: !!profileUser?.id,
    },
  );

  // Fetch following with infinite scrolling
  const {
    data: followingData,
    fetchNextPage: fetchNextFollowingPage,
    hasNextPage: hasNextFollowingPage,
    isLoading: areFollowingLoading,
    isFetchingNextPage: isFetchingMoreFollowing,
    refetch: refetchFollowing,
  } = api.follow.getFollowing.useInfiniteQuery(
    { userId: profileUser?.id || "" },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined,
      enabled: !!profileUser?.id,
    },
  );

  // Unify the follower data into a single flat array
  const allFollowers =
    followersData?.pages?.flatMap((page) => page.followers) ?? [];
  const allFollowing =
    followingData?.pages?.flatMap((page) => page.following) ?? [];
  const followersCount = followersData?.pages[0]?.totalCount ?? 0;
  const followingCount = followingData?.pages[0]?.totalCount ?? 0;

  // Mutation for follow/unfollow
  const followMutation = api.follow.followUser.useMutation({
    onSuccess: () => {
      refetchFollowStatus();
      refetchFollowers();
      refetchFollowing();
    },
  });
  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onSuccess: () => {
      refetchFollowStatus();
      refetchFollowers();
      refetchFollowing();
    },
  });

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

  // Set up Intersection Observer for followers
  const lastFollowerElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      const hasMore = hasNextFollowersPage ?? false;
      if (isFetchingMoreFollowers || !hasMore) return;

      // Disconnect the old observer if it exists
      if (followersObserver.current) {
        followersObserver.current.disconnect();
      }

      // Create a new observer and assign it to the ref
      const observer = new IntersectionObserver((entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? false;
        if (isIntersecting && hasMore) {
          fetchNextFollowersPage();
        }
      });

      followersObserver.current = observer;

      // Observe the new node
      if (node) {
        followersObserver.current.observe(node);
      }
    },
    [isFetchingMoreFollowers, hasNextFollowersPage, fetchNextFollowersPage],
  );

  // Set up Intersection Observer for following
  const lastFollowingElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      const hasMore = hasNextFollowingPage ?? false;
      if (isFetchingMoreFollowing || !hasMore) return;

      // Disconnect the old observer if it exists
      if (followingObserver.current) {
        followingObserver.current.disconnect();
      }

      // Create a new observer and assign it to the ref
      const observer = new IntersectionObserver((entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? false;
        if (isIntersecting && hasMore) {
          fetchNextFollowingPage();
        }
      });

      followingObserver.current = observer;

      // Observe the new node
      if (node) {
        followingObserver.current.observe(node);
      }
    },
    [isFetchingMoreFollowing, hasNextFollowingPage, fetchNextFollowingPage],
  );

  // Handle follow/unfollow button click
  const handleFollowToggle = () => {
    if (!profileUser?.id) return;
    if (followStatus) {
      unfollowMutation.mutate({ followingId: profileUser.id });
    } else {
      followMutation.mutate({ followingId: profileUser.id });
    }
  };

  // Handle navigation to user profile
  const handleUserClick = (targetUsername: string) => {
    router.push(`/u/${targetUsername}`);
    setIsFollowersDialogOpen(false);
    setIsFollowingDialogOpen(false);
  };

  // Handle unfollow in following dialog
  const handleUnfollow = (followingId: string) => {
    unfollowMutation.mutate({ followingId });
  };

  // Handle remove follower in followers dialog
  const handleRemoveFollower = (followerId: string) => {
    unfollowMutation.mutate({ followingId: followerId });
  };

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
      <div className="mt-6 text-center text-amber-50">
        User not found or error occurred.
      </div>
    );
  }

  return (
    <PullToRefreshClientProvider>
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
              <div className="mt-1 flex items-center justify-center gap-4 text-sm text-amber-100">
                {areFollowersLoading || areFollowingLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 bg-amber-200/50" />
                    <span>•</span>
                    <Skeleton className="h-5 w-24 bg-amber-200/50" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={isFollowersDialogOpen}
                      onOpenChange={setIsFollowersDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-amber-100"
                        >
                          {followersCount} Followers
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-amber-50">
                        <DialogHeader>
                          <DialogTitle>Followers</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {areFollowersLoading && allFollowers.length === 0 ? (
                            <div className="flex items-center justify-center py-4">
                              <Lottie
                                animationData={loading}
                                className="h-10 w-10"
                                loop
                                autoplay
                              />
                            </div>
                          ) : allFollowers.length > 0 ? (
                            allFollowers.map((follow, index) => {
                              if (allFollowers.length === index + 1) {
                                return (
                                  <div
                                    key={follow.follower.id}
                                    className="flex cursor-pointer items-center justify-between gap-3 p-2 hover:bg-gray-100"
                                    onClick={() =>
                                      handleUserClick(follow.follower.username)
                                    }
                                    ref={lastFollowerElementRef} // Attach ref to the last element
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          follow.follower.image ||
                                          "/images/default.png"
                                        }
                                        alt={follow.follower.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {follow.follower.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          @{follow.follower.username}
                                        </p>
                                      </div>
                                    </div>
                                    {isOwnProfile && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFollower(
                                            follow.follower.id,
                                          );
                                        }}
                                        disabled={unfollowMutation.isPending}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div
                                    key={follow.follower.id}
                                    className="flex cursor-pointer items-center justify-between gap-3 p-2 hover:bg-gray-100"
                                    onClick={() =>
                                      handleUserClick(follow.follower.username)
                                    }
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          follow.follower.image ||
                                          "/images/default.png"
                                        }
                                        alt={follow.follower.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {follow.follower.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          @{follow.follower.username}
                                        </p>
                                      </div>
                                    </div>
                                    {isOwnProfile && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFollower(
                                            follow.follower.id,
                                          );
                                        }}
                                        disabled={unfollowMutation.isPending}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                );
                              }
                            })
                          ) : (
                            <p className="text-center text-gray-500">
                              No followers yet.
                            </p>
                          )}
                          {isFetchingMoreFollowers && (
                            <div className="flex items-center justify-center py-4">
                              <Lottie
                                animationData={loading}
                                className="h-10 w-10"
                                loop
                                autoplay
                              />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <span>•</span>
                    <Dialog
                      open={isFollowingDialogOpen}
                      onOpenChange={setIsFollowingDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-amber-100"
                        >
                          {followingCount} Following
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-amber-50">
                        <DialogHeader>
                          <DialogTitle>Following</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {areFollowingLoading && allFollowing.length === 0 ? (
                            <div className="flex items-center justify-center py-4">
                              <Lottie
                                animationData={loading}
                                className="h-10 w-10"
                                loop
                                autoplay
                              />
                            </div>
                          ) : allFollowing.length > 0 ? (
                            allFollowing.map((follow, index) => {
                              if (allFollowing.length === index + 1) {
                                return (
                                  <div
                                    key={follow.following.id}
                                    className="flex cursor-pointer items-center justify-between gap-3 p-2 hover:bg-gray-100"
                                    onClick={() =>
                                      handleUserClick(follow.following.username)
                                    }
                                    ref={lastFollowingElementRef} // Attach ref to the last element
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          follow.following.image ||
                                          "/images/default.png"
                                        }
                                        alt={follow.following.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {follow.following.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          @{follow.following.username}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnfollow(follow.following.id);
                                      }}
                                      disabled={unfollowMutation.isPending}
                                    >
                                      Unfollow
                                    </Button>
                                  </div>
                                );
                              } else {
                                return (
                                  <div
                                    key={follow.following.id}
                                    className="flex cursor-pointer items-center justify-between gap-3 p-2 hover:bg-gray-100"
                                    onClick={() =>
                                      handleUserClick(follow.following.username)
                                    }
                                  >
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={
                                          follow.following.image ||
                                          "/images/default.png"
                                        }
                                        alt={follow.following.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                      <div>
                                        <p className="font-medium">
                                          {follow.following.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          @{follow.following.username}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnfollow(follow.following.id);
                                      }}
                                      disabled={unfollowMutation.isPending}
                                    >
                                      Unfollow
                                    </Button>
                                  </div>
                                );
                              }
                            })
                          ) : (
                            <p className="text-center text-gray-500">
                              Not following anyone yet.
                            </p>
                          )}
                          {isFetchingMoreFollowing && (
                            <div className="flex items-center justify-center py-4">
                              <Lottie
                                animationData={loading}
                                className="h-10 w-10"
                                loop
                                autoplay
                              />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                {!isOwnProfile &&
                  (!areFollowersLoading && !areFollowingLoading ? (
                    <Button
                      size="sm"
                      variant={followStatus ? "secondary" : "default"}
                      onClick={handleFollowToggle}
                      disabled={
                        followMutation.isPending ||
                        unfollowMutation.isPending ||
                        !profileUser.id
                      }
                    >
                      {followStatus ? "Unfollow" : "Follow"}
                    </Button>
                  ) : (
                    <Skeleton className="h-8 w-20 bg-amber-200/50" />
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="px-4 pt-25">
          <Tabs defaultValue="medals" className="w-full">
            <div className="mt-6 flex justify-center">
              <TabsList className="mb-3 gap-1 bg-transparent text-amber-50">
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
                {isOwnProfile && (
                  <TabsTrigger
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                    value="tracks"
                  >
                    <GoalIcon size={24}></GoalIcon>
                    Tracks
                  </TabsTrigger>
                )}
                {isOwnProfile && (
                  <TabsTrigger
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                    value="gifts"
                  >
                    <GiftIcon size={24}></GiftIcon>
                    Gifts
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

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
                <ReceivedGiftsPage></ReceivedGiftsPage>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PullToRefreshClientProvider>
  );
}
