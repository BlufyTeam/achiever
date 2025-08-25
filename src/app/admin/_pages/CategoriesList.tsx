"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { CreateCategoryForm } from "./CreateCategories";

export default function CategoryListPage() {
  const { data: categories = [], isLoading } = api.category.getAll.useQuery();
  const utils = api.useUtils();

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => utils.category.getAll.invalidate(),
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: () => {
      utils.category.getAll.invalidate();
      setEditDialog({
        open: false,
        id: "",
        name: "",
        imageFile: null,
        imagePreview: null,
      });
    },
  });

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
    imageFile: File | null;
    imagePreview: string | null;
  }>({
    open: false,
    id: "",
    name: "",
    imageFile: null,
    imagePreview: null,
  });

  const filtered = useMemo(() => {
    const list = categories.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()),
    );
    return list.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [categories, search, sortAsc]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory.mutate({ id });
    }
  };

  const handleUpdate = () => {
    if (editDialog.name.trim() === "") return toast.error("Name required");

    updateCategory.mutate({
      id: editDialog.id,
      name: editDialog.name,
      image: editDialog.imagePreview ?? undefined, // Send preview as image URL
    });
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditDialog((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result as string, // base64 string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold">Manage Categories</h1>

      <div className="mb-4 flex items-center justify-between gap-2">
        <Input
          placeholder="Search category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-amber-50"
        />
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setSortAsc((s) => !s)}>
            Sort {sortAsc ? "A→Z" : "Z→A"}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border bg-amber-50 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Name</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <div className="flex items-center justify-center py-8">
                    <Lottie
                      animationData={loading}
                      className="h-32 w-32"
                      loop
                      autoplay
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="flex items-center gap-3">
                    {cat.image && (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <span>{cat.name}</span>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setEditDialog({
                          open: true,
                          id: cat.id,
                          name: cat.name,
                          imageFile: null,
                          imagePreview: cat.image ?? null,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Category Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="bg-amber-50">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <Input
            value={editDialog.name}
            onChange={(e) =>
              setEditDialog((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Category name"
          />

          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleEditImageChange}
            />
            {editDialog.imagePreview && (
              <div className="mt-2 flex items-center gap-4">
                <img
                  src={editDialog.imagePreview}
                  alt="Preview"
                  className="h-24 w-24 rounded border object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setEditDialog((prev) => ({
                      ...prev,
                      imageFile: null,
                      imagePreview: null,
                    }))
                  }
                >
                  <X></X>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-amber-50">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <CreateCategoryForm
            onCreated={() => {
              setCreateDialogOpen(false);
              utils.category.getAll.invalidate();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
