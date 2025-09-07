"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Library, Pencil, Trash2, Star, StarOff } from "lucide-react";
import Select from "react-select";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";

export default function UserCollectionsPage({
  username,
}: {
  username: string;
}) {
  const utils = api.useUtils();
  const { data: session } = useSession();
  const currentUserId = session?.user.id;

  // --- Get userId ---
  const { data: user } = api.user.getUser.useQuery({ username });
  const userId = user?.id;

  const isOtherUserPage = userId && currentUserId && userId !== currentUserId;

  // --- Fetch collections & medals ---
  const { data: collections, isLoading } =
    api.collection.getUserCollections.useQuery(
      { userId: userId ?? "" },
      { enabled: !!userId },
    );
  const { data: userMedals } = api.userMedal.getUserMedals.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId },
  );

  // --- Fetch tracked collections for current user ---
  const { data: trackedCollections } =
    api.trackCollection.getUserTrackedCollections.useQuery(
      { userId: currentUserId ?? "" },
      { enabled: !!currentUserId },
    );

  const trackMutation = api.trackCollection.trackCollection.useMutation({
    onSuccess: () => {
      if (currentUserId)
        utils.trackCollection.getUserTrackedCollections.invalidate({
          userId: currentUserId,
        });
    },
  });

  const untrackMutation = api.trackCollection.untrackCollection.useMutation({
    onSuccess: () => {
      if (currentUserId)
        utils.trackCollection.getUserTrackedCollections.invalidate({
          userId: currentUserId,
        });
    },
  });

  const isTracked = (collectionId: string) =>
    trackedCollections?.some((tc) => tc.collectionId === collectionId);

  const toggleTrack = (collectionId: string) => {
    if (!currentUserId) return;
    if (isTracked(collectionId)) {
      untrackMutation.mutate({ userId: currentUserId, collectionId });
    } else {
      trackMutation.mutate({ userId: currentUserId, collectionId });
    }
  };

  // --- Collection mutations ---
  const createMutation = api.collection.create.useMutation({
    onSuccess: () => {
      if (userId) utils.collection.getUserCollections.invalidate({ userId });
      resetForm();
      setCreateOpen(false);
    },
  });
  const updateMutation = api.collection.update.useMutation({
    onSuccess: () => {
      if (userId) utils.collection.getUserCollections.invalidate({ userId });
      resetForm();
      setEditOpen(false);
    },
  });
  const deleteMutation = api.collection.delete.useMutation({
    onSuccess: () => {
      if (userId) utils.collection.getUserCollections.invalidate({ userId });
      setDeleteDialogId(null);
    },
  });

  // --- State ---
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [selectedMedals, setSelectedMedals] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setCollectionName("");
    setCollectionDescription("");
    setSelectedMedals([]);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!userId) return;
    createMutation.mutate({
      name: collectionName,
      description: collectionDescription,
      ownerId: userId,
      medalIds: selectedMedals,
    });
  };

  type CollectionType = NonNullable<typeof collections>[number];
  const handleEditOpen = (collection: CollectionType) => {
    resetForm();
    setEditingId(collection.id);
    setCollectionName(collection.name);
    setCollectionDescription(collection.description ?? "");
    setSelectedMedals(collection.medals.map((m) => m.medal.id));
    setEditOpen(true);
  };
  const handleEditSave = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      name: collectionName,
      description: collectionDescription,
      medalIds: selectedMedals,
    });
  };
  const handleDelete = (id: string) => deleteMutation.mutate({ id });

  if (!user || isLoading)
    return (
      <div className="flex items-center justify-center py-24">
        <Lottie animationData={loading} className="h-24 w-24" loop autoplay />
      </div>
    );

  return (
    <div className="p-4">
      {/* Header + Create */}
      {!isOtherUserPage && (
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Collection
          </Button>
        </div>
      )}

      {/* Collections Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {collections?.map((c) => {
          const medalsToShow = c.medals.slice(0, 5);
          const hasMore = c.medals.length > 5;

          return (
            <div
              key={c.id}
              className="relative max-w-xs cursor-pointer rounded-xl border bg-amber-50 p-4 transition hover:shadow"
              onClick={() => {
                setSelectedCollection(c);
                setPreviewOpen(true);
              }}
            >
              <Library />
              <h2 className="text-lg font-bold text-black">{c.name}</h2>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {c.description}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {medalsToShow.map((m) => (
                  <img
                    key={m.medal.id}
                    src={m.medal.image ?? ""}
                    alt={m.medal.name}
                    className="h-8 w-8 rounded object-contain"
                  />
                ))}
                {hasMore && <span className="text-sm">…</span>}
              </div>

              {/* Show star only if other user page */}
              {isOtherUserPage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 text-yellow-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTrack(c.id);
                  }}
                >
                  {isTracked(c.id) ? (
                    <Star className="fill-amber-300" />
                  ) : (
                    <Star />
                  )}
                </Button>
              )}

              {/* Edit/Delete only for current user */}
              {!isOtherUserPage && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditOpen(c);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogId(c.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewOpen} onOpenChange={() => setPreviewOpen(false)}>
        <DialogContent className="max-w-md bg-amber-50">
          {/* Track/Untrack in preview if other user page */}
          {isOtherUserPage && selectedCollection && (
            <div className="mt-4 flex justify-center">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 left-2 text-yellow-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrack(selectedCollection.id);
                }}
              >
                {isTracked(selectedCollection.id) ? (
                  <Star className="fill-amber-300" />
                ) : (
                  <Star></Star>
                )}
              </Button>
            </div>
          )}
          <DialogHeader className="flex items-center justify-center">
            <DialogTitle className="text-2xl">
              {selectedCollection?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="flex items-center justify-center text-gray-400">
            {selectedCollection?.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCollection?.medals.map((m: any) => (
              <div
                key={m.medal.id}
                className="flex flex-col items-center text-center"
              >
                <img
                  src={m.medal.image ?? ""}
                  alt={m.medal.name}
                  className="h-12 w-12 rounded object-contain"
                />
                <span className="text-xs">{m.medal.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      {[createOpen, editOpen].map((isOpen, idx) => {
        const isEdit = idx === 1;
        return (
          <Dialog
            key={idx}
            open={isOpen}
            onOpenChange={() =>
              isEdit ? setEditOpen(false) : setCreateOpen(false)
            }
          >
            <DialogContent className="max-w-lg bg-amber-50">
              <DialogHeader>
                <DialogTitle>
                  {isEdit ? "Edit Collection" : "Create Collection"}
                </DialogTitle>
              </DialogHeader>

              <Input
                placeholder="Name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="mb-2"
              />
              <Textarea
                placeholder="Description"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                className="mb-2"
              />

              {/* Medal Multi-Select Dropdown */}
              <div className="mb-2">
                <Select
                  isMulti
                  options={userMedals?.medals.map((m) => ({
                    value: m.medal.id,
                    label: m.medal.name,
                  }))}
                  value={userMedals?.medals
                    .filter((m) => selectedMedals.includes(m.medal.id))
                    .map((m) => ({ value: m.medal.id, label: m.medal.name }))}
                  onChange={(vals) =>
                    setSelectedMedals(vals.map((v) => v.value))
                  }
                  placeholder="Select medals to add"
                  className="text-sm"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    isEdit ? setEditOpen(false) : setCreateOpen(false)
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEdit ? handleEditSave : handleCreate}
                  disabled={
                    isEdit ? updateMutation.isPending : createMutation.isPending
                  }
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })}

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteDialogId}
        onOpenChange={() => setDeleteDialogId(null)}
      >
        <DialogContent className="bg-amber-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this collection?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>
              No
            </Button>
            <Button
              onClick={() => handleDelete(deleteDialogId!)}
              disabled={deleteMutation.isPending}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
