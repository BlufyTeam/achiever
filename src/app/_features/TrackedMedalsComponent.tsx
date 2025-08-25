"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { ArrowLeft, X, BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

// Simple progress bar component
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full bg-green-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function TrackedMedalCard({
  medal,
  username,
  completedTasks,
  totalTasks,
  onUntrack,
  onEarn,
  isLoading,
}: {
  medal: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    tasks: { id: string; title: string }[]; // now includes tasks
  };
  username: string;
  completedTasks: number;
  totalTasks: number;
  onUntrack: (medalId: string) => void;
  onEarn: (medalId: string) => void;
  isLoading: boolean;
}) {
  const router = useRouter();
  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("svg")
    ) {
      return;
    }
    router.push(`/t/${username}/${medal.id}`);
  };

  const progressValue =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      onClick={handleCardClick}
      className="flex w-full cursor-pointer items-center justify-center"
    >
      <div className="relative w-full max-w-[50vw] flex-col rounded-lg border p-6 shadow transition hover:shadow-md">
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onUntrack(medal.id);
                }}
                aria-label="Untrack medal"
                className="text-red-500 hover:bg-red-500 hover:text-white"
              >
                <X size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Untrack Medal</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEarn(medal.id);
                }}
                aria-label="Mark as earned"
                className="text-green-500 hover:bg-green-500 hover:text-white"
              >
                <BadgeCheck size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mark as Earned</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-2 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ) : (
          <>
            {medal.image ? (
              <img
                src={medal.image}
                alt={medal.name}
                className="mx-auto mb-3 h-24 w-24 rounded object-contain"
                loading="lazy"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded bg-gray-300 text-gray-600">
                No Image
              </div>
            )}
            <h3 className="text-center text-lg font-semibold text-amber-50">
              {medal.name}
            </h3>
            {medal.description && (
              <p className="text-center text-sm text-gray-400">
                {medal.description}
              </p>
            )}
            {totalTasks > 0 && (
              <div className="mt-3">
                <p className="text-center text-xs text-gray-500">
                  {completedTasks} / {totalTasks} tasks completed
                </p>
                <ProgressBar value={progressValue} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TrackedMedalsPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [medalToUntrack, setMedalToUntrack] = useState<string | null>(null);

  const { data: user, isLoading: isUserLoading } = api.user.getUser.useQuery(
    { username },
    { enabled: !!username },
  );
  const userId = user?.id ?? "";

  const { data: trackedMedals, isLoading: isMedalsLoading } =
    api.trackMedal.getTrackedMedals.useQuery({ userId }, { enabled: !!userId });

  const { data: completedTasksMap } =
    api.userTask.getCompletedTasksCountByMedal.useQuery(
      {
        userId,
        medalIds: trackedMedals?.map((tm) => tm.medal.id) ?? [],
      },
      { enabled: !!trackedMedals?.length },
    );

  const utils = api.useUtils();
  const untrackMedalMutation = api.trackMedal.untrackMedal.useMutation({
    onSuccess: () => utils.userMedal.getUserMedals.invalidate(),
  });

  const addUserMedalMutation = api.userMedal.addUserMedal.useMutation({
    onSuccess: () => utils.userMedal.getUserMedals.invalidate(),
  });

  const handleUntrack = (medalId: string) => {
    setMedalToUntrack(medalId);
    setDialogOpen(true);
  };

  const handleConfirmUntrack = async () => {
    if (medalToUntrack) {
      await untrackMedalMutation.mutateAsync({ medalId: medalToUntrack });
      setDialogOpen(false);
      setMedalToUntrack(null);
    }
  };

  const handleEarn = async (medalId: string) => {
    if (!userId) return;
    await addUserMedalMutation.mutateAsync({ userId, medalId });
    await untrackMedalMutation.mutateAsync({ medalId });
  };

  if (isUserLoading || isMedalsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/u/${username}`)}
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {trackedMedals && trackedMedals.length > 0 ? (
          trackedMedals.map((tm) => (
            <TrackedMedalCard
              key={tm.id}
              medal={tm.medal}
              username={username} // <-- add this
              completedTasks={completedTasksMap?.[tm.medal.id] ?? 0}
              totalTasks={tm.medal.tasks.length}
              onUntrack={handleUntrack}
              onEarn={handleEarn}
              isLoading={isMedalsLoading}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-400">
            No medals are being tracked.
          </p>
        )}
      </div>

      {/* Confirm Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Confirm Untrack</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to untrack this medal?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmUntrack}>
                Untrack
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
