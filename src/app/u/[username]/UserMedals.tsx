"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import { MedalIcon, Search, X, Pencil } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import {
  MedalsGridContent,
  MedalVouches,
  DialogContext,
  type MedalWithEarned,
} from "../../_features/MedalComponents";

export default function UserMedalsGrid({ username }: { username: string }) {
  const {
    data: profileUser,
    isLoading: isProfileUserLoading,
    isError: isProfileUserError,
  } = api.user.getUser.useQuery({ username }, { enabled: !!username });

  const { data: currentUser, isLoading: isCurrentUserLoading } =
    api.user.getCurrentUser.useQuery();

  const profileUserId = profileUser?.id;
  const currentUserId = currentUser?.id;
  const isOwnProfile = currentUser?.username === username;

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMedalId, setDialogMedalId] = useState<string | null>(null);
  const limit = 10;
  const { data: allCategories } = api.category.getAll.useQuery();
  const categories = allCategories ?? [];
  const {
    data = { medals: [], medalCount: 0 },
    isLoading: isMedalsLoading,
    refetch,
  } = api.userMedal.getUserMedals.useQuery(
    {
      userId: profileUserId!,
      offset,
      limit,
      search: searchTerm || undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
    },
    {
      enabled: !!profileUserId,
    },
  );

  const [isEditing, setIsEditing] = useState(false);
  const [localMedals, setLocalMedals] = useState<MedalWithEarned[]>([]);
  const [deletedMedalIds, setDeletedMedalIds] = useState<string[]>([]);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const deleteMedalMutation = api.userMedal.deleteUserMedal.useMutation();
  const updateOrderMutation = api.userMedal.updateMedalOrder.useMutation();

  useEffect(() => {
    if (!data?.medals) return;
    const sortedMedals = [...data.medals].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    if (offset === 0) {
      setLocalMedals((prev) => {
        if (
          prev.length !== sortedMedals.length ||
          prev[0]?.medal.id !== sortedMedals[0]?.medal.id
        ) {
          return sortedMedals;
        }
        return prev;
      });
    } else {
      setLocalMedals((prev) => {
        const newMedals = sortedMedals.filter(
          (m) => !prev.some((p) => p.medal.id === m.medal.id),
        );
        if (newMedals.length === 0) return prev;
        return [...prev, ...newMedals].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
      });
    }
  }, [data, offset]);

  useEffect(() => {
    if (profileUserId) {
      setOffset(0);
      setIsEditing(false);
      setDeletedMedalIds([]);
      refetch();
    }
  }, [searchTerm, selectedCategory, profileUserId, refetch]);

  const handleDelete = (medalId: string) => {
    setLocalMedals((prev) => prev.filter((m) => m.medal.id !== medalId));
    setDeletedMedalIds((prev) => [...prev, medalId]);
  };

  const handleSave = async () => {
    if (!profileUserId) return;

    try {
      if (deletedMedalIds.length > 0) {
        await Promise.all(
          deletedMedalIds.map((medalId) =>
            deleteMedalMutation.mutateAsync({
              userId: profileUserId,
              medalId,
            }),
          ),
        );
      }
      if (localMedals.length > 0) {
        await updateOrderMutation.mutateAsync(
          localMedals.map((medal, index) => ({
            userId: profileUserId,
            medalId: medal.medal.id,
            sortOrder: index,
          })),
        );
      }
      setIsEditing(false);
      setDeletedMedalIds([]);
      refetch();
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const handleDiscard = () => {
    setIsEditing(false);
    setDeletedMedalIds([]);
    setLocalMedals(
      data?.medals.sort((a, b) => a.sortOrder - b.sortOrder) ?? [],
    );
    setIsDiscardDialogOpen(false);
  };

  const hasNextPage = data ? offset + limit < data.medalCount : false;

  if (isProfileUserLoading || isCurrentUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  if (isProfileUserError || !profileUserId) {
    return (
      <div className="p-4">
        <div className="mb-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <div className="relative w-full max-w-sm">
            <Input
              type="text"
              placeholder="Search medals by name..."
              className="bg-amber-50 pr-10"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(inputValue);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (searchTerm) {
                  setInputValue("");
                  setSearchTerm("");
                } else {
                  setSearchTerm(inputValue);
                }
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-600 hover:text-gray-900"
              aria-label={searchTerm ? "Clear search" : "Search"}
            >
              {searchTerm ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] bg-amber-50">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center text-amber-50">
          User not found or error occurred.
        </div>
      </div>
    );
  }

  const totalMedals = data.medalCount;

  return (
    <DialogContext.Provider value={{ setDialogOpen, setDialogMedalId }}>
      <div className="flex h-full flex-col p-4 pb-20">
        {/* Controls: Search, Filter, Edit Button */}
        <div className="mb-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <div className="relative w-full max-w-sm">
            <Input
              type="text"
              placeholder="Search medals by name..."
              className="bg-amber-50 pr-10"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchTerm(inputValue);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (searchTerm) {
                  setInputValue("");
                  setSearchTerm("");
                } else {
                  setSearchTerm(inputValue);
                }
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-600 hover:text-gray-900"
              aria-label={searchTerm ? "Clear search" : "Search"}
            >
              {searchTerm ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
          <div className="flex">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px] bg-amber-50">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                aria-label={isEditing ? "Cancel Edit" : "Edit Medals"}
                className="ml-2 text-amber-50 hover:text-black"
              >
                <Pencil size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Total medals count */}
        <div className="mb-4 text-center">
          <Tooltip>
            <TooltipTrigger>
              <div className="flex w-full items-center justify-center space-x-2 text-amber-300">
                <MedalIcon />
                <p>{totalMedals}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All Medals</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Save and Discard Buttons (visible in edit mode) */}
        {isEditing && isOwnProfile && (
          <div className="mb-4 flex justify-center gap-2">
            <Button
              onClick={() => setIsSaveDialogOpen(true)}
              disabled={
                deleteMedalMutation.isPending || updateOrderMutation.isPending
              }
              className="bg-amber-50 text-black hover:bg-amber-100"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(true)}
              className="text-amber-50 hover:bg-amber-100 hover:text-black"
            >
              Discard
            </Button>
          </div>
        )}

        {/* Show loading spinner above search/filter only when loading first page */}
        {isMedalsLoading && offset === 0 && (
          <div className="mb-4 flex justify-center">
            <Lottie
              animationData={loading}
              className="h-10 w-10"
              loop
              autoplay
            />
          </div>
        )}

        {/* Medals grid or no medals message */}
        <MedalsGridContent
          localMedals={localMedals}
          setLocalMedals={setLocalMedals}
          isEditing={isEditing && isOwnProfile}
          profileUserId={profileUserId}
          currentUserId={currentUserId}
          isMedalsLoading={isMedalsLoading}
          handleDelete={handleDelete}
        />

        {/* Load More button */}
        {hasNextPage && !isMedalsLoading && !isEditing && (
          <div className="py-4 text-center">
            <Button
              onClick={() => setOffset((prev) => prev + limit)}
              disabled={isMedalsLoading}
            >
              Load More
            </Button>
          </div>
        )}

        {/* Small spinner when loading more data (pagination) */}
        {isMedalsLoading && localMedals.length > 0 && (
          <div className="flex justify-center py-6">
            <Lottie
              animationData={loading}
              className="h-10 w-10"
              loop
              autoplay
            />
          </div>
        )}

        {/* Dialog for Vouch List */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {dialogMedalId && profileUserId && (
            <DialogContent className="bg-amber-50 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Vouches</DialogTitle>
              </DialogHeader>
              <MedalVouches
                userId={profileUserId}
                medalId={dialogMedalId}
                onClose={() => setDialogOpen(false)}
              />
            </DialogContent>
          )}
        </Dialog>

        {/* Dialog for Save Confirmation */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent className="bg-amber-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Save</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to save your changes?</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSaveDialogOpen(false)}
              >
                No
              </Button>
              <Button onClick={handleSave}>Yes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for Discard Confirmation */}
        <Dialog
          open={isDiscardDialogOpen}
          onOpenChange={setIsDiscardDialogOpen}
        >
          <DialogContent className="bg-amber-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Discard</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to discard all unsaved changes?</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDiscardDialogOpen(false)}
              >
                No
              </Button>
              <Button onClick={handleDiscard}>Yes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DialogContext.Provider>
  );
}
