"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
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
export default function CategoryListPage() {
  const { data: categories = [], isLoading } = api.category.getAll.useQuery();
  const utils = api.useUtils();
  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => utils.category.getAll.invalidate(),
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: () => {
      utils.category.getAll.invalidate();
      setEditDialog({ open: false, id: "", name: "" });
    },
  });

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [editDialog, setEditDialog] = useState({
    open: false,
    id: "",
    name: "",
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
    updateCategory.mutate({ id: editDialog.id, name: editDialog.name });
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold">Manage Categories</h1>

      <div className="mb-4 flex items-center justify-between gap-2">
        <Input
          placeholder="Search category..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className="max-w-sm bg-amber-50"
        />
        <Button variant="outline" onClick={() => setSortAsc((s) => !s)}>
          Sort {sortAsc ? "A→Z" : "Z→A"}
        </Button>
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
            {filtered.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setEditDialog({ open: true, id: cat.id, name: cat.name })
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
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="py-6 text-center text-gray-500">No results found</div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
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
          <DialogFooter className="mt-4">
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
