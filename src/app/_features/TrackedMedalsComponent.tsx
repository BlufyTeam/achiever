"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { ArrowLeft, X, BadgeCheck, Star, Library, Router } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Dialog, DialogContent } from "~/components/ui/dialog";

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
    tasks: { id: string; title: string }[];
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
    )
      return;
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

function TrackedCollectionCard({
  collection,
  onUntrack,
  onOpen,
}: {
  collection: {
    id: string;
    name: string;
    description: string | null;
    owner?: { username: string } | null;
    image: string | null;
    medals?: any[];
  };
  onUntrack: (collectionId: string) => void;
  onOpen: () => void;
}) {
  const medalsToShow = collection.medals?.slice(0, 5) ?? [];
  const hasMore = (collection.medals?.length ?? 0) > 5;

  return (
    <>
      <div
        className="relative max-w-xs cursor-pointer rounded-xl border bg-amber-50 p-4 transition hover:shadow"
        onClick={onOpen}
      >
        <div className="absolute top-2 right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm("Are you sure you want to untrack this collection?")
                  ) {
                    onUntrack(collection.id);
                  }
                }}
              >
                <Star className="fill-yellow-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Untrack Collection</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* {collection.image ? (
          <img
            src={collection.image}
            alt={collection.name}
            className="mx-auto mb-3 h-24 w-24 rounded object-contain"
          />
        ) : (
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded bg-gray-300 text-gray-600">
            No Image
          </div>
        )} */}
        <Library />
        <h3 className="text-center text-lg font-semibold text-black">
          {collection.name}
        </h3>
        {collection?.owner && (
          <p className="text-xs text-gray-500">
            by {collection.owner.username}
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {medalsToShow.map((m: any) => (
            <img
              key={m.medal.id}
              src={m.medal.image ?? ""}
              alt={m.medal.name}
              className="h-8 w-8 rounded object-contain"
            />
          ))}
          {hasMore && <span className="text-sm">…</span>}
        </div>
      </div>
    </>
  );
}

export default function TrackedMedalsPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [dialogCollection, setDialogCollection] = useState<any | null>(null);

  const { data: user, isLoading: isUserLoading } = api.user.getUser.useQuery(
    { username },
    { enabled: !!username },
  );
  const userId = user?.id ?? "";

  const { data: trackedMedals, isLoading: isMedalsLoading } =
    api.trackMedal.getTrackedMedals.useQuery({ userId }, { enabled: !!userId });

  const { data: completedTasksMap } =
    api.userTask.getCompletedTasksCountByMedal.useQuery(
      { userId, medalIds: trackedMedals?.map((tm) => tm.medal.id) ?? [] },
      { enabled: !!trackedMedals?.length },
    );

  const { data: trackedCollections } =
    api.trackCollection.getUserTrackedCollections.useQuery(
      { userId },
      { enabled: !!userId },
    );

  const utils = api.useUtils();

  const untrackMedalMutation = api.trackMedal.untrackMedal.useMutation({
    onSuccess: () => utils.userMedal.getUserMedals.invalidate(),
  });

  const addUserMedalMutation = api.userMedal.addUserMedal.useMutation({
    onSuccess: () => utils.userMedal.getUserMedals.invalidate(),
  });

  const untrackCollectionMutation =
    api.trackCollection.untrackCollection.useMutation({
      onSuccess: () =>
        utils.trackCollection.getUserTrackedCollections.invalidate(),
    });

  const handleUntrackMedal = (medalId: string) => {
    if (confirm("Are you sure you want to untrack this medal?")) {
      untrackMedalMutation.mutate({ medalId });
    }
  };

  const handleEarn = async (medalId: string) => {
    if (!userId) return;
    await addUserMedalMutation.mutateAsync({ userId, medalId });
    await untrackMedalMutation.mutateAsync({ medalId });
  };

  const handleUntrackCollection = (collectionId: string) => {
    if (!userId) return;
    if (confirm("Are you sure you want to untrack this collection?")) {
      untrackCollectionMutation.mutate({ userId, collectionId });
    }
  };

  if (isUserLoading || isMedalsLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 font-sans">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/u/${username}`)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Grid */}
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {trackedMedals?.map((tm) => (
          <TrackedMedalCard
            key={tm.id}
            medal={tm.medal}
            username={username}
            completedTasks={completedTasksMap?.[tm.medal.id] ?? 0}
            totalTasks={tm.medal.tasks.length}
            onUntrack={handleUntrackMedal}
            onEarn={handleEarn}
            isLoading={isMedalsLoading}
          />
        ))}

        {trackedCollections?.map((tc) => (
          <TrackedCollectionCard
            key={tc.id}
            collection={{
              ...tc.collection,
              medals: tc.collection.medals,
              owner: tc.collection.owner, // make sure API includes owner
            }}
            onUntrack={() => handleUntrackCollection(tc.collectionId)}
            onOpen={() => setDialogCollection(tc.collection)}
          />
        ))}

        {!trackedMedals?.length && !trackedCollections?.length && (
          <p className="col-span-full text-center text-gray-400">
            No medals or collections are being tracked.
          </p>
        )}
      </div>

      {/* Dialog */}
      <Dialog
        open={!!dialogCollection}
        onOpenChange={() => setDialogCollection(null)}
      >
        <DialogContent className="max-w-3xl bg-amber-50">
          <div className="mb-4 flex flex-col items-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              {dialogCollection?.name}
            </h2>
            {dialogCollection?.description && (
              <p className="text-sm text-gray-600">
                {dialogCollection.description}
              </p>
            )}
            {dialogCollection?.owner && (
              <p
                className="text-xs text-gray-500 hover:cursor-pointer"
                onClick={() =>
                  router.push("/u/" + dialogCollection.owner.username)
                }
              >
                by {dialogCollection.owner.username}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {dialogCollection?.medals?.map((m: any) => (
              <div
                key={m.medal.id}
                className="flex flex-col items-center hover:cursor-pointer"
                onClick={() => router.push(`/medal/${m.medal.id}`)}
              >
                {m.medal.image ? (
                  <img
                    src={m.medal.image}
                    alt={m.medal.name}
                    className="h-20 w-20 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-200 text-gray-500">
                    No Image
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-700">{m.medal.name}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
