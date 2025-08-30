"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  DialogContext,
  VouchButton,
  VouchCountDisplay,
} from "../../../_features/MedalComponents";
import type { Vouch } from "../../../_features/MedalComponents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  ArrowLeft,
  CircleCheck,
  Circle,
  Bookmark,
  Check,
  Trash2,
  Gift,
} from "lucide-react";

// ==================== VouchesList Component ====================
function VouchesList({ userId, medalId }: { userId: string; medalId: string }) {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const { data, isLoading, isError } = api.userMedal.getVouches.useQuery(
    { userId, medalId, offset, limit },
    { enabled: !!userId && !!medalId },
  );

  useEffect(() => {
    if (data?.vouches) {
      setVouches((prev) =>
        offset === 0 ? data.vouches : [...prev, ...data.vouches],
      );
    }
  }, [data, offset]);

  const hasNextPage = data ? offset + limit < data.vouchCount : false;

  if (isLoading && offset === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Lottie animationData={loading} className="h-8 w-8" loop autoplay />
      </div>
    );
  }

  if (isError)
    return <p className="text-center text-red-500">Error loading vouches.</p>;
  if (vouches.length === 0)
    return <p className="text-center text-gray-500">No vouches yet.</p>;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        {vouches.map((vouch) => (
          <div
            key={vouch.id}
            className="flex items-center space-x-2 rounded-full bg-gray-100 p-2"
          >
            {vouch.vouchedBy.image ? (
              <img
                src={vouch.vouchedBy.image}
                alt={vouch.vouchedBy.name ?? "User"}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs text-gray-600">
                ?
              </div>
            )}
            <span className="text-sm">
              {vouch.vouchedBy.name || "Anonymous"}
            </span>
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={isLoading}
            variant="ghost"
          >
            Load More Vouches
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== TasksList Component ====================
function TasksList({
  tasks,
  completedTasks,
  markTaskMutation,
  unmarkTaskMutation,
  isOwner,
}: {
  tasks: { id: string; title: string; description: string | null }[];
  completedTasks: Map<string, Date>;
  markTaskMutation: ReturnType<
    typeof api.userTask.markTaskAsCompleted.useMutation
  >;
  unmarkTaskMutation: ReturnType<
    typeof api.userTask.unmarkTaskAsCompleted.useMutation
  >;
  isOwner: boolean;
}) {
  if (!tasks || tasks.length === 0) return null;

  const handleTaskClick = (taskId: string) => {
    if (!isOwner) return;
    if (completedTasks.has(taskId)) {
      unmarkTaskMutation.mutate({ taskId });
    } else {
      markTaskMutation.mutate({ taskId });
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="mb-2 text-center text-lg font-semibold text-gray-800">
        Tasks to Earn this Medal:
      </h4>
      <ul className="space-y-3">
        {tasks.map((task) => {
          const completedAt = completedTasks.get(task.id);
          const isCompleted = !!completedAt;
          return (
            <li key={task.id} className="flex items-start space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTaskClick(task.id)}
                disabled={!isOwner}
                className="flex-shrink-0"
              >
                {isCompleted ? (
                  <CircleCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </Button>
              <div>
                <p
                  className={`font-medium ${
                    isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p
                    className={`text-sm ${
                      isCompleted
                        ? "text-gray-400 line-through"
                        : "text-gray-600"
                    }`}
                  >
                    {task.description}
                  </p>
                )}
                {isCompleted && (
                  <p className="text-xs text-green-600">
                    Completed on: {new Date(completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ==================== TrackButton Component ====================
function TrackButton({
  medalId,
  isCurrentUserOwned,
  isCurrentUserTracking,
  isTrackingLoading,
  isOwnedLoading,
}: {
  medalId: string;
  isCurrentUserOwned: boolean;
  isCurrentUserTracking: boolean;
  isTrackingLoading: boolean;
  isOwnedLoading: boolean;
}) {
  const utils = api.useUtils();
  const trackMedalMutation = api.trackMedal.trackMedal.useMutation({
    onSuccess: () => utils.trackMedal.isTracked.invalidate(),
  });
  const untrackMedalMutation = api.trackMedal.untrackMedal.useMutation({
    onSuccess: () => utils.trackMedal.isTracked.invalidate(),
  });

  const handleToggleTrack = () => {
    if (isCurrentUserOwned) return;
    if (isCurrentUserTracking) {
      untrackMedalMutation.mutate({ medalId });
    } else {
      trackMedalMutation.mutate({ medalId });
    }
  };

  const isLoading =
    isTrackingLoading ||
    isOwnedLoading ||
    trackMedalMutation.isPending ||
    untrackMedalMutation.isPending;

  const buttonText = isCurrentUserOwned
    ? "Owned"
    : isCurrentUserTracking
      ? "Tracked"
      : "Track";

  const buttonIcon = isCurrentUserOwned ? (
    <Check className="h-4 w-4" />
  ) : (
    <Bookmark className="h-4 w-4" />
  );

  return (
    <Button
      onClick={handleToggleTrack}
      disabled={isCurrentUserOwned || isLoading}
      variant={
        isCurrentUserOwned || isCurrentUserTracking ? "default" : "outline"
      }
      className="space-x-2"
    >
      {isLoading ? (
        <Lottie animationData={loading} className="h-6 w-6" loop autoplay />
      ) : (
        <>
          {buttonIcon} <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
}

// ==================== GiftButton Component ====================
function GiftButton({
  medalId,
  isLoading,
  setGiftDialogOpen,
}: {
  medalId: string;
  isLoading: boolean;
  setGiftDialogOpen: (open: boolean) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setGiftDialogOpen(true)}
          disabled={isLoading}
          variant="outline"
          className="space-x-2"
        >
          <Gift className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>This medal can only be gifted.</TooltipContent>
    </Tooltip>
  );
}

// ==================== GiftDialog Component ====================
function GiftDialog({
  medalId,
  open,
  setOpen,
}: {
  medalId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [giftStatus, setGiftStatus] = useState<{
    status: "idle" | "success" | "error" | "already-owned";
    message?: string;
  }>({ status: "idle" });
  const [cursor, setCursor] = useState<string | null>(null);
  const [followings, setFollowings] = useState<
    {
      id: string;
      name: string | null;
      username: string;
      image: string | null;
    }[]
  >([]);
  const limit = 10;

  const utils = api.useUtils();
  const { data: currentUser } = api.user.getCurrentUser.useQuery();
  const { data: followingsData, isLoading: isFollowingsLoading } =
    api.follow.getFollowing.useQuery(
      { userId: currentUser?.id ?? "", cursor, limit },
      { enabled: !!currentUser?.id && open },
    );

  const giftMedalMutation = api.gift.giftMedal.useMutation({
    onSuccess: () => {
      setGiftStatus({ status: "success", message: "Gift sent successfully!" });
      utils.gift.getSentGifts.invalidate();
    },
    onError: (error) => {
      setGiftStatus({ status: "error", message: error.message });
    },
  });

  // State to track the user being checked for medal ownership
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: hasMedal, isLoading: isCheckingMedal } =
    api.userMedal.getUserMedalStatus.useQuery(
      { userId: selectedUserId ?? "", medalId },
      { enabled: !!selectedUserId && !!medalId },
    );

  useEffect(() => {
    if (followingsData?.following) {
      setFollowings((prev) =>
        cursor === null
          ? followingsData.following.map((f) => f.following)
          : [...prev, ...followingsData.following.map((f) => f.following)],
      );
    }
  }, [followingsData, cursor]);

  const filteredFollowings = useMemo(() => {
    return followings.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [followings, searchQuery]);

  const handleGift = async (giftedToId: string) => {
    if (!currentUser) {
      setGiftStatus({ status: "error", message: "You must be logged in." });
      return;
    }
    if (giftedToId === currentUser.id) {
      setGiftStatus({
        status: "error",
        message: "You cannot gift to yourself.",
      });
      return;
    }

    try {
      // Call API directly to check if user already owns medal
      const hasMedal = await utils.userMedal.getUserMedalStatus.fetch({
        userId: giftedToId,
        medalId,
      });

      if (hasMedal) {
        setGiftStatus({
          status: "already-owned",
          message: "This user already has this medal.",
        });
        return;
      }

      giftMedalMutation.mutate({ medalId, giftedToId, message: "" });
    } catch (err) {
      setGiftStatus({ status: "error", message: "Something went wrong." });
    }
  };

  const hasNextPage = followingsData?.nextCursor !== undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearchQuery("");
          setGiftStatus({ status: "idle" });
          setCursor(null);
          //setFollowings([]);
          setSelectedUserId(null);
        }
      }}
    >
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Gift Medal</DialogTitle>
          <DialogDescription>
            Select a user from your followings to gift this medal to.
          </DialogDescription>
        </DialogHeader>
        {giftStatus.status === "success" ? (
          <div className="py-4 text-center text-green-600">
            {giftStatus.message}
            <div className="mt-4">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        ) : giftStatus.status === "already-owned" ||
          giftStatus.status === "error" ? (
          <div
            className={`py-4 text-center ${
              giftStatus.status === "already-owned"
                ? "text-orange-600"
                : "text-red-500"
            }`}
          >
            {giftStatus.message}
            <div className="mt-4">
              <Button onClick={() => setGiftStatus({ status: "idle" })}>
                Try Another User
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="ml-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Input
              placeholder="Search followings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            {isFollowingsLoading && cursor === null ? (
              <div className="flex items-center justify-center py-4">
                <Lottie
                  animationData={loading}
                  className="h-8 w-8"
                  loop
                  autoplay
                />
              </div>
            ) : filteredFollowings.length === 0 ? (
              <p className="text-center text-gray-500">
                {searchQuery
                  ? "No followings match your search."
                  : "You are not following anyone."}
              </p>
            ) : (
              <ul className="max-h-60 space-y-2 overflow-y-auto">
                {filteredFollowings.map((user) => (
                  <li
                    key={user.id}
                    className="flex cursor-pointer items-center justify-between rounded p-2 hover:bg-gray-100"
                    onClick={() => handleGift(user.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.username}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs text-gray-600">
                          ?
                        </div>
                      )}
                      <span className="text-sm">{user.username}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        giftMedalMutation.isPending ||
                        (isCheckingMedal && selectedUserId === user.id)
                      }
                    >
                      {giftMedalMutation.isPending &&
                      giftMedalMutation.variables?.giftedToId === user.id ? (
                        <Lottie
                          animationData={loading}
                          className="h-5 w-5"
                          loop
                          autoplay
                        />
                      ) : isCheckingMedal && selectedUserId === user.id ? (
                        <Lottie
                          animationData={loading}
                          className="h-5 w-5"
                          loop
                          autoplay
                        />
                      ) : (
                        "Gift"
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {hasNextPage && !searchQuery && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => setCursor(followingsData?.nextCursor ?? null)}
                  disabled={isFollowingsLoading}
                  variant="ghost"
                >
                  Load More
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== AddRemoveButton Component ====================
function AddRemoveButton({
  medalId,
  isCurrentUserOwned,
  isOwnedLoading,
  userId,
  setDialogOpen,
  setDialogMedalId,
}: {
  medalId: string;
  isCurrentUserOwned: boolean;
  isOwnedLoading: boolean;
  userId: string;
  setDialogOpen: (open: boolean) => void;
  setDialogMedalId: (medalId: string | null) => void;
}) {
  const utils = api.useUtils();
  const { data: medal, isLoading: isMedalLoading } =
    api.medals.getMedalById.useQuery({ medalId }, { enabled: !!medalId });

  const addUserMedalMutation = api.userMedal.addUserMedal.useMutation({
    onSuccess: () => {
      utils.userMedal.getUserMedalStatus.invalidate();
      utils.trackMedal.isTracked.invalidate();
    },
  });
  const deleteUserMedalMutation = api.userMedal.deleteUserMedal.useMutation({
    onSuccess: () => {
      utils.userMedal.getUserMedalStatus.invalidate();
      utils.trackMedal.isTracked.invalidate();
    },
  });

  const handleAdd = () => {
    addUserMedalMutation.mutate({ userId, medalId });
  };

  const handleRemove = () => {
    setDialogMedalId(medalId);
    setDialogOpen(true);
  };

  const isLoading =
    isOwnedLoading ||
    isMedalLoading ||
    addUserMedalMutation.isPending ||
    deleteUserMedalMutation.isPending;

  if (isLoading) {
    return (
      <Button disabled className="space-x-2">
        <Lottie animationData={loading} className="h-6 w-6" loop autoplay />
      </Button>
    );
  }

  if (
    medal?.status === "UNAVAILABLE" ||
    (medal?.status === "GIFT_ONLY" && !isCurrentUserOwned)
  ) {
    return null;
  }

  return (
    <Button
      onClick={isCurrentUserOwned ? handleRemove : handleAdd}
      disabled={isLoading}
      variant={isCurrentUserOwned ? "destructive" : "outline"}
      className="space-x-2"
    >
      {isCurrentUserOwned ? (
        <Trash2 className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </Button>
  );
}

// ==================== Main UserMedalPage ====================
export default function UserMedalPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const medalId = params.usermedalId as string;
  const utils = api.useUtils();

  // --- Delete dialog state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMedalId, setDialogMedalId] = useState<string | null>(null);

  // --- Vouch dialog state ---
  const [vouchDialogOpen, setVouchDialogOpen] = useState(false);
  const [vouchMedalId, setVouchMedalId] = useState<string | null>(null);

  // --- Gift dialog state ---
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);

  // --- Fetch user ---
  const { data: user, isLoading: isUserLoading } = api.user.getUser.useQuery(
    { username },
    { enabled: !!username },
  );

  // --- Fetch specific user medal ---
  const { data: userMedal, isLoading: isMedalLoading } =
    api.userMedal.getUserMedalById.useQuery(
      { userId: user?.id ?? "", medalId },
      { enabled: !!user?.id && !!medalId },
    );

  // --- Current user ---
  const { data: currentUser } = api.user.getCurrentUser.useQuery();
  const isOwner = currentUser?.id === user?.id;

  // --- Check ownership & tracking ---
  const { data: isCurrentUserOwned, isLoading: isOwnedLoading } =
    api.userMedal.getUserMedalStatus.useQuery(
      { userId: currentUser?.id ?? "", medalId },
      { enabled: !!currentUser?.id && !!medalId },
    );
  const { data: isCurrentUserTracking, isLoading: isTrackingLoading } =
    api.trackMedal.isTracked.useQuery(
      { userId: currentUser?.id ?? "", medalId },
      { enabled: !!currentUser?.id && !!medalId },
    );

  // --- Completed tasks ---
  const { data: completedTasksData, refetch: refetchCompletedTasks } =
    api.userTask.getCompletedTasksForMedal.useQuery(
      { userId: user?.id ?? "", medalId: userMedal?.medal.id ?? "" },
      { enabled: !!user?.id && !!userMedal?.medal.id },
    );
  const completedTasks = new Map(
    completedTasksData?.completedTasks?.map((t) => [t.taskId, t.completedAt]),
  );

  const markTaskMutation = api.userTask.markTaskAsCompleted.useMutation({
    onSuccess: () => refetchCompletedTasks(),
  });
  const unmarkTaskMutation = api.userTask.unmarkTaskAsCompleted.useMutation({
    onSuccess: () => refetchCompletedTasks(),
  });

  // --- Delete mutation ---
  const deleteUserMedalMutation = api.userMedal.deleteUserMedal.useMutation({
    onSuccess: () => {
      utils.userMedal.getUserMedalStatus.invalidate();
      utils.trackMedal.isTracked.invalidate();
      setDialogOpen(false);
      setDialogMedalId(null);
    },
  });

  // --- Add mutation ---
  const addUserMedalMutation = api.userMedal.addUserMedal.useMutation({
    onSuccess: () => {
      utils.userMedal.getUserMedalStatus.invalidate();
      utils.trackMedal.isTracked.invalidate();
    },
  });

  const isButtonLoading =
    isOwnedLoading ||
    isMedalLoading ||
    isTrackingLoading ||
    addUserMedalMutation.isPending ||
    deleteUserMedalMutation.isPending;

  if (isUserLoading || isMedalLoading || isOwnedLoading || isTrackingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  if (!user || !userMedal) {
    return (
      <div className="text-center text-red-500">
        {!user ? "User not found" : "Medal not found"}
      </div>
    );
  }

  return (
    <DialogContext.Provider value={{ setDialogOpen, setDialogMedalId }}>
      <div className="mt-5 flex h-full flex-col items-center justify-center font-sans">
        <div className="absolute top-4 left-4 mt-15">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              utils.trackMedal.getTrackedMedals.invalidate();
              utils.userTask.getCompletedTasksCountByMedal.invalidate();
              router.push(`/u/${username}`);
            }}
            aria-label="Go back to profile"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        <h3 className="mb-8 text-center text-4xl font-extrabold text-gray-900">
          {user.username ?? username}'s Medal
        </h3>

        <div className="relative mt-5 w-full max-w-sm rounded-lg border bg-white p-6 shadow transition hover:shadow-md">
          <div className="top-2 right-2 flex justify-between space-x-2">
            {userMedal.medal.status === "EARNABLE" && (
              <TrackButton
                medalId={userMedal.medal.id}
                isCurrentUserOwned={!!isCurrentUserOwned}
                isCurrentUserTracking={!!isCurrentUserTracking}
                isTrackingLoading={isTrackingLoading}
                isOwnedLoading={isOwnedLoading}
              />
            )}
            {userMedal.medal.status === "GIFT_ONLY" && (
              <GiftButton
                medalId={userMedal.medal.id}
                isLoading={isButtonLoading}
                setGiftDialogOpen={setGiftDialogOpen}
              />
            )}
            <AddRemoveButton
              medalId={userMedal.medal.id}
              isCurrentUserOwned={!!isCurrentUserOwned}
              isOwnedLoading={isOwnedLoading}
              userId={currentUser?.id ?? ""}
              setDialogOpen={setDialogOpen}
              setDialogMedalId={setDialogMedalId}
            />
          </div>

          {userMedal.medal.image ? (
            <img
              src={userMedal.medal.image}
              alt={userMedal.medal.name}
              className="mx-auto mb-3 h-24 w-24 rounded object-contain"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded bg-gray-300 text-gray-600">
              No Image
            </div>
          )}

          <h3 className="text-center text-lg font-semibold text-gray-900">
            {userMedal.medal.name}
          </h3>
          {userMedal.medal.description && (
            <p className="text-center text-sm text-gray-600">
              {userMedal.medal.description}
            </p>
          )}

          <div className="flex items-center justify-center space-x-2 p-2">
            <VouchButton
              medalId={userMedal.medal.id}
              medalOwnerId={user.id}
              currentUserId={currentUser?.id}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVouchMedalId(userMedal.medal.id);
                setVouchDialogOpen(true);
              }}
              aria-label="Show who vouched"
              className="text-black hover:text-white"
            >
              <VouchCountDisplay
                userId={user.id}
                medalId={userMedal.medal.id}
              />
            </Button>
          </div>

          <TasksList
            tasks={userMedal.medal.tasks ?? []}
            completedTasks={completedTasks}
            markTaskMutation={markTaskMutation}
            unmarkTaskMutation={unmarkTaskMutation}
            isOwner={isOwner}
          />

          <p className="mt-4 text-center text-xs text-gray-500">
            Earned on:{" "}
            {new Date(userMedal.earnedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-amber-50">
            <DialogHeader>
              <DialogTitle>Confirm Removal</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this medal from your collection?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (dialogMedalId && currentUser?.id) {
                    deleteUserMedalMutation.mutate({
                      userId: currentUser.id,
                      medalId: dialogMedalId,
                    });
                  }
                }}
                disabled={deleteUserMedalMutation.isPending}
              >
                {deleteUserMedalMutation.isPending ? (
                  <Lottie
                    animationData={loading}
                    className="h-6 w-6"
                    loop
                    autoplay
                  />
                ) : (
                  "Remove"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vouches dialog */}
        <Dialog open={vouchDialogOpen} onOpenChange={setVouchDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Vouches</DialogTitle>
            </DialogHeader>
            {vouchMedalId && (
              <VouchesList userId={user.id} medalId={vouchMedalId} />
            )}
          </DialogContent>
        </Dialog>

        {/* Gift dialog */}
        <GiftDialog
          medalId={userMedal.medal.id}
          open={giftDialogOpen}
          setOpen={setGiftDialogOpen}
        />
      </div>
    </DialogContext.Provider>
  );
}
