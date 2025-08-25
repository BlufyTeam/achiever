"use client";

import {
  MedalIcon,
  Search,
  ThumbsUp,
  X,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDndMonitor,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Lottie from "lottie-react";
import { api } from "~/trpc/react";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import loading from "~/animations/loading.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

// Shared Types
export type MedalWithEarned = {
  medal: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    categories: { category: { id: string; name: string } }[];
    tasks: { id: string; title: string; description: string | null }[];
  };
  earnedAt: Date;
  sortOrder: number;
};

export type Vouch = {
  id: string;
  userId: string;
  medalId: string;
  createdAt: Date;
  vouchedById: string;
  vouchedBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

function ProgressBar({ value }: { value: number }) {
  if (value < 0 || value > 100) return null;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full bg-green-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// Context for dialog state
export type DialogContextType = {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDialogMedalId: React.Dispatch<React.SetStateAction<string | null>>;
};
export const DialogContext = createContext<DialogContextType | undefined>(
  undefined,
);

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      "useDialogContext must be used within a DialogContext.Provider",
    );
  }
  return context;
}

export function MedalVouches({
  userId,
  medalId,
  onClose,
}: {
  userId: string;
  medalId: string;
  onClose: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const { data, isLoading, isError } = api.userMedal.getVouches.useQuery(
    { userId, medalId, offset, limit },
    { enabled: !!userId && !!medalId },
  );

  const [vouches, setVouches] = useState<Vouch[]>(data?.vouches ?? []);

  useEffect(() => {
    if (data?.vouches) {
      setVouches((prev) =>
        offset === 0 ? data.vouches : [...prev, ...data.vouches],
      );
    }
  }, [data, offset]);

  const hasNextPage = data ? offset + limit < data.vouchCount : false;

  return (
    <div className="max-h-72 overflow-auto p-4">
      {isLoading && offset === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
        </div>
      ) : isError || !data ? (
        <p>Error loading vouches.</p>
      ) : vouches.length === 0 ? (
        <p>No vouches yet.</p>
      ) : (
        <>
          {vouches.map((vouch) => (
            <div key={vouch.id} className="flex items-center space-x-3 py-1">
              {vouch.vouchedBy.image ? (
                <img
                  src={vouch.vouchedBy.image}
                  alt={vouch.vouchedBy.name ?? "User"}
                  className="h-8 w-8 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs text-gray-600">
                  ?
                </div>
              )}
              <span>{vouch.vouchedBy.name || "Anonymous"}</span>
            </div>
          ))}

          {hasNextPage && (
            <div className="mt-4 text-center">
              <Button
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Lottie
                      animationData={loading}
                      className="h-14 w-14"
                      loop
                      autoplay
                    />
                  </div>
                ) : (
                  "Load More Vouches"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function MedalCard({
  medal,
  earnedAt,
  profileUserId,
  currentUserId,
  rank,
  isEditing,
  onConfirmDelete,
  id,
  completedTasks,
  isLoading, // New prop for loading state
}: {
  medal: MedalWithEarned["medal"];
  earnedAt: Date;
  profileUserId: string;
  currentUserId: string | undefined;
  rank?: number;
  isEditing: boolean;
  onConfirmDelete: (id: string) => void;
  id: string;
  completedTasks: number;
  isLoading?: boolean;
}) {
  const { setDialogOpen, setDialogMedalId } = useDialogContext();
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const { data: user } = api.user.getUser.useQuery(
    { id: profileUserId },
    { enabled: !!profileUserId },
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const rankStyles = {
    1: "bg-yellow-400 text-black",
    2: "bg-gray-300 text-black",
    3: "bg-amber-600 text-white",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      isEditing ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("svg")
    ) {
      return;
    }
    if (user?.username) {
      router.push(`/u/${user.username}/${medal.id}`);
    }
  };

  const totalTasks = medal.tasks?.length ?? 0;
  const showProgressBar = totalTasks > 0;
  const progressValue =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`flex w-full items-center justify-center ${isEditing ? "cursor-move" : "cursor-pointer"}`}
    >
      <div className="relative flex w-full max-w-[50vw] flex-col rounded-lg border p-6 shadow transition hover:shadow-md">
        {rank && rank <= 3 && (
          <div
            className={`absolute top-2 left-2 rounded-full px-2 py-1 text-xs font-bold ${
              rankStyles[rank as 1 | 2 | 3]
            }`}
          >
            {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
          </div>
        )}

        {isEditing && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onConfirmDelete(id)}
              aria-label="Delete medal"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </Button>

            <div {...attributes} {...listeners} className="cursor-move">
              <GripVertical size={18} className="text-gray-500" />
            </div>
          </div>
        )}

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

        {!isEditing && (
          <div className="flex items-center justify-center space-x-2 p-2">
            <VouchButton
              medalId={medal.id}
              medalOwnerId={profileUserId}
              currentUserId={currentUserId}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDialogMedalId(medal.id);
                setDialogOpen(true);
              }}
              aria-label="Show who vouched"
              className="text-amber-50 hover:text-black"
            >
              <VouchCountDisplay userId={profileUserId} medalId={medal.id} />
            </Button>
          </div>
        )}

        <div className="mt-4 h-8">
          {" "}
          {/* Fixed height container */}
          {isLoading ? (
            <div className="space-y-2">
              <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : showProgressBar ? (
            <div className="space-y-2">
              <p className="text-center text-xs text-gray-500">
                {completedTasks} / {totalTasks} tasks completed
              </p>
              <ProgressBar value={progressValue} />
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>

        <p className="mt-2 text-center text-xs text-gray-500">
          {new Date(earnedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export function VouchButton({
  medalId,
  medalOwnerId,
  currentUserId,
}: {
  medalId: string;
  medalOwnerId: string;
  currentUserId: string | undefined;
}) {
  const utils = api.useUtils();
  const { data: serverVouches, refetch } = api.userMedal.getVouches.useQuery(
    { userId: medalOwnerId, medalId, offset: 0, limit: 10 },
    { enabled: !!medalOwnerId && !!medalId },
  );

  const [vouches, setVouches] = useState<Vouch[]>(serverVouches?.vouches ?? []);
  const { data: currentUser } = api.user.getCurrentUser.useQuery();

  useEffect(() => {
    if (serverVouches?.vouches) setVouches(serverVouches.vouches);
  }, [serverVouches]);

  const addVouchMutation = api.userMedal.addVouch.useMutation();
  const deleteVouchMutation = api.userMedal.deleteVouch.useMutation();

  const userVouch = vouches.find((v) => v.vouchedBy.id === currentUserId);
  const hasVouched = Boolean(userVouch);

  const toggleVouch = () => {
    if (!currentUserId) return;

    if (hasVouched) {
      setVouches((prev) =>
        prev.filter((v) => v.vouchedBy.id !== currentUserId),
      );

      deleteVouchMutation.mutate(
        { id: userVouch!.id },
        {
          onError: () => {
            setVouches(serverVouches?.vouches ?? []);
          },
          onSuccess: () => {
            utils.userMedal.getVouches.invalidate({
              userId: medalOwnerId,
              medalId,
            });
            refetch();
          },
        },
      );
    } else {
      const tempVouch: Vouch = {
        id: `temp-${Math.random()}`,
        userId: medalOwnerId,
        medalId,
        createdAt: new Date(),
        vouchedById: currentUserId,
        vouchedBy: {
          id: currentUserId,
          name: currentUser?.name ?? "You",
          email: currentUser?.email ?? "",
          image: currentUser?.image ?? null,
        },
      };
      setVouches((prev) => [...prev, tempVouch]);

      addVouchMutation.mutate(
        { userId: medalOwnerId, medalId, vouchedById: currentUserId },
        {
          onError: () => {
            setVouches(serverVouches?.vouches ?? []);
          },
          onSuccess: () => {
            utils.userMedal.getVouches.invalidate({
              userId: medalOwnerId,
              medalId,
            });
            refetch();
          },
        },
      );
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            onClick={toggleVouch}
            className={`cursor-pointer bg-amber-50 text-center text-sm ${
              hasVouched ? "text-blue-600" : "text-black hover:text-amber-50"
            }`}
            aria-label={hasVouched ? "Remove Vouch" : "Add Vouch"}
            disabled={
              addVouchMutation.isPending ||
              deleteVouchMutation.isPending ||
              !currentUserId
            }
          >
            <ThumbsUp size={18} />
          </Button>
        </span>
      </TooltipTrigger>

      <TooltipContent>
        <p>
          {vouches.length} vouch{vouches.length === 1 ? "" : "es"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function VouchCountDisplay({
  userId,
  medalId,
}: {
  userId: string;
  medalId: string;
}) {
  const { data: vouches, isLoading } = api.userMedal.getVouches.useQuery({
    userId,
    medalId,
    offset: 0,
    limit: 10,
  });

  const count = vouches?.vouchCount ?? 0;
  return (
    <>
      {isLoading ? (
        <div className="h-4 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      ) : (
        <>
          {count} vouch{count === 1 ? "" : "es"}
        </>
      )}
    </>
  );
}

function SortableMedals({
  localMedals,
  setLocalMedals,
  isEditing,
  profileUserId,
  currentUserId,
  isMedalsLoading,
  handleDelete,
  completedTasksMap,
  sensors,
}: {
  localMedals: MedalWithEarned[];
  setLocalMedals: React.Dispatch<React.SetStateAction<MedalWithEarned[]>>;
  isEditing: boolean;
  profileUserId: string;
  currentUserId: string | undefined;
  isMedalsLoading: boolean;
  handleDelete: (medalId: string) => void;
  completedTasksMap: Record<string, number> | undefined;
  sensors: ReturnType<typeof useSensors>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteConfirmationMedalId, setDeleteConfirmationMedalId] = useState<
    string | null
  >(null);

  useDndMonitor({
    onDragStart({ active }) {
      setActiveId(active.id as string);
    },
    onDragEnd({ active, over }) {
      setActiveId(null);
      if (!over) return;

      const activeIndex = localMedals.findIndex(
        (m) => m.medal.id === active.id,
      );
      const overIndex = localMedals.findIndex((m) => m.medal.id === over.id);

      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        const reorderedMedals = Array.from(localMedals);
        const [movedMedal] = reorderedMedals.splice(activeIndex, 1);
        if (movedMedal) {
          reorderedMedals.splice(overIndex, 0, movedMedal);
          const updatedMedals = reorderedMedals.map((medal, index) => ({
            ...medal,
            sortOrder: index,
          }));
          setLocalMedals(updatedMedals);
        }
      }
    },
    onDragCancel() {
      setActiveId(null);
    },
  });

  return (
    <>
      <SortableContext
        items={localMedals.map((m) => m.medal.id)}
        strategy={verticalListSortingStrategy}
        disabled={!isEditing}
      >
        <div className="grid flex-grow grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {!isMedalsLoading && localMedals.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">
              No medals found.
            </div>
          ) : (
            localMedals.map(({ medal, earnedAt }, index) => (
              <MedalCard
                key={medal.id}
                id={medal.id}
                medal={medal}
                earnedAt={earnedAt}
                profileUserId={profileUserId}
                currentUserId={currentUserId}
                rank={index + 1}
                isEditing={isEditing}
                onConfirmDelete={() => setDeleteConfirmationMedalId(medal.id)}
                completedTasks={completedTasksMap?.[medal.id] || 0}
                isLoading={isMedalsLoading || !completedTasksMap} // Pass combined loading state
              />
            ))
          )}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId
          ? (() => {
              const activeMedal = localMedals.find(
                (m) => m.medal.id === activeId,
              );
              return activeMedal ? (
                <MedalCard
                  id={activeId}
                  medal={activeMedal.medal}
                  earnedAt={activeMedal.earnedAt}
                  profileUserId={profileUserId}
                  currentUserId={currentUserId}
                  rank={
                    localMedals.findIndex((m) => m.medal.id === activeId) + 1
                  }
                  isEditing={isEditing}
                  onConfirmDelete={() => {}}
                  completedTasks={
                    completedTasksMap?.[activeMedal.medal.id] || 0
                  }
                  isLoading={isMedalsLoading || !completedTasksMap}
                />
              ) : null;
            })()
          : null}
      </DragOverlay>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmationMedalId}
        onOpenChange={() => setDeleteConfirmationMedalId(null)}
      >
        <DialogContent className="bg-amber-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>Are you sure you want to delete this medal?</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmationMedalId(null)}
            >
              No
            </Button>

            <Button
              onClick={() => {
                handleDelete(deleteConfirmationMedalId!);
                setDeleteConfirmationMedalId(null);
              }}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MedalsGridContent({
  localMedals,
  setLocalMedals,
  isEditing,
  profileUserId,
  currentUserId,
  isMedalsLoading,
  handleDelete,
  limit = Infinity,
}: {
  localMedals: MedalWithEarned[];
  setLocalMedals: React.Dispatch<React.SetStateAction<MedalWithEarned[]>>;
  isEditing: boolean;
  profileUserId: string;
  currentUserId: string | undefined;
  isMedalsLoading: boolean;
  handleDelete: (medalId: string) => void;
  limit?: number;
}) {
  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const medalIds = localMedals.map((medal) => medal.medal.id);
  const { data: completedTasksMap, isLoading: isCompletedTasksLoading } =
    api.userTask.getCompletedTasksCountByMedal.useQuery(
      { userId: profileUserId, medalIds: medalIds },
      { enabled: !!profileUserId && medalIds.length > 0 },
    );

  const isLoading = isMedalsLoading || isCompletedTasksLoading;

  const medalsToShow = localMedals.slice(0, limit);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      autoScroll={isEditing}
    >
      <SortableMedals
        localMedals={medalsToShow}
        setLocalMedals={setLocalMedals}
        isEditing={isEditing}
        profileUserId={profileUserId}
        currentUserId={currentUserId}
        isMedalsLoading={isLoading}
        handleDelete={handleDelete}
        completedTasksMap={completedTasksMap}
        sensors={sensors}
      />
    </DndContext>
  );
}
