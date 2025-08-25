"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "~/trpc/react";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import {
  ArrowLeft,
  CircleCheck,
  Circle,
  Bookmark,
  Check,
  Plus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";

// A component to display the tracking button
function TrackButton({ medalId }: { medalId: string }) {
  const utils = api.useUtils();
  const { data: currentUser } = api.user.getCurrentUser.useQuery();
  const currentUserId = currentUser?.id ?? "";

  // Check if the current user owns this medal
  const { data: isOwned, isLoading: isOwnedLoading } =
    api.userMedal.getUserMedalStatus.useQuery(
      { userId: currentUserId, medalId },
      { enabled: !!currentUserId && !!medalId },
    );

  // Check if the current user is tracking this medal
  const { data: isTracked, isLoading: isTrackedLoading } =
    api.medals.isTracked.useQuery(
      { userId: currentUserId, medalId },
      { enabled: !!currentUserId && !!medalId },
    );

  const trackMedalMutation = api.medals.trackMedal.useMutation({
    onSuccess: () => {
      utils.medals.isTracked.invalidate();
    },
  });

  const untrackMedalMutation = api.medals.untrackMedal.useMutation({
    onSuccess: () => {
      utils.medals.isTracked.invalidate();
    },
  });

  const handleToggleTrack = () => {
    if (isOwned) return;
    if (isTracked) {
      untrackMedalMutation.mutate({ medalId });
    } else {
      trackMedalMutation.mutate({ medalId });
    }
  };

  const isLoading =
    isOwnedLoading ||
    isTrackedLoading ||
    trackMedalMutation.isPending ||
    untrackMedalMutation.isPending;

  let buttonText = "Track";
  let buttonIcon = <Bookmark className="h-4 w-4" />;
  let buttonVariant = "outline";

  if (isOwned) {
    buttonText = "Owned";
    buttonIcon = <Check className="h-4 w-4" />;
    buttonVariant = "default";
  } else if (isTracked) {
    buttonText = "Tracked";
    buttonIcon = <Bookmark className="h-4 w-4 fill-current" />;
    buttonVariant = "default";
  }

  return (
    <Button
      onClick={handleToggleTrack}
      disabled={isOwned || isLoading || !currentUserId}
      variant={buttonVariant as "outline" | "default"}
      className="space-x-2"
    >
      {isLoading ? (
        <Lottie animationData={loading} className="h-6 w-6" loop autoplay />
      ) : (
        <>
          {buttonIcon}
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
}

// Main page component
export default function MedalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const medalId = params.medalid as string;

  // Fetch the medal's details using the new API
  const {
    data: medal,
    isLoading,
    isError,
    error,
  } = api.medals.getMedalById.useQuery({ medalId }, { enabled: !!medalId });

  const { data: currentUser } = api.user.getCurrentUser.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  if (isError || !medal) {
    return (
      <div className="text-center text-red-500">
        Medal not found.
        {isError && <p>Error: {error?.message}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-4 left-4 mt-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-gray-800" />
        </Button>
      </div>

      <div className="relative w-full max-w-lg rounded-lg border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl md:p-8">
        <div className="absolute top-4 right-4">
          <TrackButton medalId={medal.id} />
        </div>
        <div className="flex flex-col items-center justify-center">
          {medal.image ? (
            <img
              src={medal.image}
              alt={medal.name}
              className="mx-auto mb-4 h-32 w-32 rounded-full object-contain shadow-md"
              loading="lazy"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-gray-600 shadow-md">
              <Plus size={32} />
            </div>
          )}
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
            {medal.name}
          </h1>
          {medal.description && (
            <p className="text-center text-sm text-gray-600">
              {medal.description}
            </p>
          )}
        </div>

        {medal.categories.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800">Categories:</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {medal.categories.map((c) => (
                <span
                  key={c.category.id}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {c.category.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {medal.tasks.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Tasks to Earn this Medal:
            </h2>
            <ul className="space-y-4">
              {medal.tasks.map((task) => (
                <li key={task.id} className="flex items-start space-x-3">
                  <Circle className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-gray-600">
                        {task.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
