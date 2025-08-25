"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import loading from "~/animations/loading.json";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "~/components/ui/dialog";
import {
  ArrowDownZA,
  ArrowUpZA,
  Library,
  Pencil,
  User,
  Trash2, // ⬅️ NEW
} from "lucide-react";
import { DialogFooter } from "~/components/ui/dialog";
import { useSession } from "next-auth/react";
import Select from "react-select";
import Lottie from "lottie-react";

export default function CollectionsPage() {
  const { data: collections = [], isLoading } =
    api.collection.getAll.useQuery();

  const utils = api.useUtils();

  const createMutation = api.collection.create.useMutation();
  const updateMutation = api.collection.update.useMutation();

  // ⬅️ NEW: delete mutation
  const deleteMutation = api.collection.delete.useMutation({
    onSuccess: async () => {
      await utils.collection.getAll.invalidate();
    },
  });

  const [selectedCollection, setSelectedCollection] = useState<
    (typeof collections)[0] | null
  >(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collectionImage, setCollectionImage] = useState("");
  const [selectedMedals, setSelectedMedals] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: session } = useSession();
  const { data: medals = [] } = api.medals.getAll.useQuery();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCollectionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const filtered = useMemo(() => {
    return collections
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) =>
        sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
  }, [collections, search, sortAsc]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center justify-center py-8">
          <Lottie animationData={loading} className="h-32 w-32" loop autoplay />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-amber-50"
        />
        <Button onClick={() => setSortAsc(!sortAsc)} variant="outline">
          {sortAsc ? (
            <ArrowDownZA className="h-4 w-4" />
          ) : (
            <ArrowUpZA className="h-4 w-4" />
          )}
          <span className="ml-2">Sort A–Z</span>
        </Button>
        <div className="flex items-center justify-between">
          <Button onClick={() => setCreateOpen(true)}>+ New Collection</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((collection) => (
          <div
            key={collection.id}
            className="relative cursor-pointer rounded-xl border bg-amber-50 p-4 transition hover:shadow"
          >
            <Library />
            <h2 className="text-lg font-bold">{collection.name}</h2>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {collection.description}
            </p>

            {/* Click anywhere else opens preview dialog */}
            <div
              onClick={() => setSelectedCollection(collection)}
              className="absolute inset-0"
            />
            {/* Action buttons (edit + delete) */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(collection.id);
                  setCollectionName(collection.name);
                  setCollectionDescription(collection.description ?? "");
                  setCollectionImage(collection.image ?? "");
                  setSelectedMedals(collection.medals.map((m) => m.medal.id));
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              {/* ⬅️ NEW: Delete button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  const ok = window.confirm(
                    `Delete collection "${collection.name}"? This cannot be undone.`,
                  );
                  if (!ok) return;
                  deleteMutation.mutate({ id: collection.id });
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview dialog */}
      <Dialog
        open={!!selectedCollection}
        onOpenChange={() => setSelectedCollection(null)}
      >
        <DialogContent className="bg-amber-50">
          {selectedCollection && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCollection.name}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-between">
                <p className="text-muted-foreground mb-4 text-sm">
                  {selectedCollection.description || "No description."}
                </p>
                <p className="flex text-gray-700">
                  <User width={18} height={18} />
                  {selectedCollection.owner.name}
                </p>
              </div>
              <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto">
                {selectedCollection.medals.length === 0 ? (
                  <p className="text-muted-foreground col-span-2 text-sm">
                    No medals in this collection.
                  </p>
                ) : (
                  selectedCollection.medals.map((m) => (
                    <div
                      key={m.medal.id}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      {m.medal.image && (
                        <img
                          src={m.medal.image}
                          alt={m.medal.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{m.medal.name}</p>
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {m.medal.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl bg-amber-50">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={collectionDescription}
              onChange={(e) => setCollectionDescription(e.target.value)}
            />
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {collectionImage && (
                <img
                  src={collectionImage}
                  alt="Preview"
                  className="mt-2 h-24 w-24 rounded-md border object-cover"
                />
              )}
            </div>

            <Select
              isMulti
              options={medals.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              onChange={(vals) => setSelectedMedals(vals.map((v) => v.value))}
              placeholder="Select medals to add"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                if (!session?.user?.id) return;
                await createMutation.mutateAsync({
                  name: collectionName,
                  description: collectionDescription,
                  image: collectionImage,
                  ownerId: session.user.id,
                  medalIds: selectedMedals,
                });
                setCreateOpen(false);
                setCollectionName("");
                setCollectionDescription("");
                setCollectionImage("");
                setSelectedMedals([]);
                await utils.collection.getAll.invalidate();
              }}
              disabled={createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingId(null);
            setCollectionName("");
            setCollectionDescription("");
            setCollectionImage("");
            setSelectedMedals([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-amber-50">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Collection name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={collectionDescription}
              onChange={(e) => setCollectionDescription(e.target.value)}
            />
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {collectionImage && (
                <img
                  src={collectionImage}
                  alt="Preview"
                  className="mt-2 h-24 w-24 rounded-md border object-cover"
                />
              )}
            </div>

            <Select
              isMulti
              options={medals.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              value={medals
                .filter((m) => selectedMedals.includes(m.id))
                .map((m) => ({ value: m.id, label: m.name }))}
              onChange={(vals) => setSelectedMedals(vals.map((v) => v.value))}
              placeholder="Select medals to add"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                if (!editingId) return;
                await updateMutation.mutateAsync({
                  id: editingId,
                  name: collectionName,
                  description: collectionDescription,
                  image: collectionImage,
                  medalIds: selectedMedals,
                });
                setEditOpen(false);
                setEditingId(null);
                setCollectionName("");
                setCollectionDescription("");
                setCollectionImage("");
                setSelectedMedals([]);
                await utils.collection.getAll.invalidate();
              }}
              disabled={updateMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
