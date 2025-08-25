"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  DialogContext,
  VouchButton,
  VouchCountDisplay,
} from "../../../_features/MedalComponents";
import type { Vouch } from "../../../_features/MedalComponents";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { Button } from "~/components/ui/button";
import { ArrowLeft, CircleCheck, Circle, Bookmark, Check } from "lucide-react";

// Vouches list
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

  if (isLoading && offset === 0)
    return (
      <div className="flex items-center justify-center py-4">
        <Lottie animationData={loading} className="h-8 w-8" loop autoplay />
      </div>
    );

  if (isError)
    return <p className="text-center text-red-500">Error loading vouches.</p>;
  if (vouches.length === 0)
    return <p className="text-center text-gray-500">No vouches yet.</p>;

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="mb-2 text-center text-lg font-semibold text-gray-800">
        Vouched by:
      </h4>
      <div className="flex flex-wrap justify-center gap-2">
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

// Tasks list
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
    if (completedTasks.has(taskId)) unmarkTaskMutation.mutate({ taskId });
    else markTaskMutation.mutate({ taskId });
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
                  className={`font-medium ${isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p
                    className={`text-sm ${isCompleted ? "text-gray-400 line-through" : "text-gray-600"}`}
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

// Track button
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
  const trackMutation = api.trackMedal.trackMedal.useMutation({
    onSuccess: () => utils.trackMedal.isTracked.invalidate(),
  });
  const untrackMutation = api.trackMedal.untrackMedal.useMutation({
    onSuccess: () => utils.trackMedal.isTracked.invalidate(),
  });

  const handleToggle = () => {
    if (isCurrentUserOwned) return;
    if (isCurrentUserTracking) untrackMutation.mutate({ medalId });
    else trackMutation.mutate({ medalId });
  };

  const isLoading =
    isTrackingLoading ||
    isOwnedLoading ||
    trackMutation.isPending ||
    untrackMutation.isPending;
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
      onClick={handleToggle}
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

// Main page
export default function TrackedMedalPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const trackedMedalId = params.trackedmedalid as string;
  const utils = api.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMedalId, setDialogMedalId] = useState<string | null>(null);

  // 1. Get user
  const { data: user, isLoading: isUserLoading } = api.user.getUser.useQuery(
    { username },
    { enabled: !!username },
  );

  // 2. Get tracked medal (basic info)
  const { data: trackedMedals, isLoading: isTrackedLoading } =
    api.trackMedal.getTrackedMedals.useQuery(
      { userId: user?.id ?? "" },
      { enabled: !!user?.id },
    );
  const trackedMedal = trackedMedals?.find(
    (tm) => tm.medalId === trackedMedalId,
  );

  // 3. Fetch full medal including tasks
  const { data: effectiveMedal, isLoading: isMedalLoading } =
    api.medals.getMedalById.useQuery(
      { medalId: trackedMedalId },
      { enabled: !!trackedMedal },
    );

  // 4. Current user info
  const { data: currentUser } = api.user.getCurrentUser.useQuery();
  const isOwner = currentUser?.id === user?.id;

  const { data: isCurrentUserOwned, isLoading: isOwnedLoading } =
    api.userMedal.getUserMedalStatus.useQuery(
      { userId: currentUser?.id ?? "", medalId: trackedMedalId },
      { enabled: !!currentUser?.id && !!trackedMedalId },
    );

  const { data: isCurrentUserTracking, isLoading: isTrackingLoading } =
    api.trackMedal.isTracked.useQuery(
      { userId: currentUser?.id ?? "", medalId: trackedMedalId },
      { enabled: !!currentUser?.id && !!trackedMedalId },
    );

  // 5. Completed tasks
  const { data: completedTasksData, refetch: refetchCompletedTasks } =
    api.userTask.getCompletedTasksForMedal.useQuery(
      { userId: user?.id ?? "", medalId: effectiveMedal?.id ?? "" },
      { enabled: !!user?.id && !!effectiveMedal?.id },
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

  if (
    isUserLoading ||
    isTrackedLoading ||
    isMedalLoading ||
    isOwnedLoading ||
    isTrackingLoading ||
    !effectiveMedal
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
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

        <h2 className="mb-8 text-center text-4xl font-extrabold text-gray-900">
          {user?.name ?? username}'s Tracked Medal
        </h2>

        <div className="relative w-full max-w-sm rounded-lg border bg-white p-6 shadow transition hover:shadow-md">
          <div className="absolute top-2 right-2">
            <TrackButton
              medalId={effectiveMedal.id}
              isCurrentUserOwned={!!isCurrentUserOwned}
              isCurrentUserTracking={!!isCurrentUserTracking}
              isTrackingLoading={isTrackingLoading}
              isOwnedLoading={isOwnedLoading}
            />
          </div>

          {effectiveMedal.image ? (
            <img
              src={effectiveMedal.image}
              alt={effectiveMedal.name}
              className="mx-auto mb-3 h-24 w-24 rounded object-contain"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded bg-gray-300 text-gray-600">
              No Image
            </div>
          )}

          <h3 className="text-center text-lg font-semibold text-gray-900">
            {effectiveMedal.name}
          </h3>
          {effectiveMedal.description && (
            <p className="text-center text-sm text-gray-600">
              {effectiveMedal.description}
            </p>
          )}

          <div className="flex items-center justify-center space-x-2 p-2">
            <VouchButton
              medalId={effectiveMedal.id}
              medalOwnerId={user?.id!}
              currentUserId={currentUser?.id}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDialogMedalId(effectiveMedal.id);
                setDialogOpen(true);
              }}
              aria-label="Show who vouched"
              className="text-black hover:text-white"
            >
              <VouchCountDisplay
                userId={user?.id!}
                medalId={effectiveMedal.id}
              />
            </Button>
          </div>

          <TasksList
            tasks={effectiveMedal.tasks}
            completedTasks={completedTasks}
            markTaskMutation={markTaskMutation}
            unmarkTaskMutation={unmarkTaskMutation}
            isOwner={isOwner}
          />

          <VouchesList userId={user?.id!} medalId={effectiveMedal.id} />
        </div>
      </div>
    </DialogContext.Provider>
  );
}
