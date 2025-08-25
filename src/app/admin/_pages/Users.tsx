"use client";
import { Pencil, Trash2, MedalIcon } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import CreateUserPage from "./CreateUser";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "~/components/ui/select";
import { UserMedalsDialog } from "~/app/_components/admin/userMedalDialog";

export default function UsersPage() {
  const { data: users, refetch, isLoading } = api.user.getAllUsers.useQuery();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [originalUser, setOriginalUser] = useState<null | {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    role: "USER" | "ADMIN";
    image?: string | null;
  }>(null);

  const deleteUser = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Use updateUserByAdmin instead of updateUser
  const updateUser = api.user.updateUserByAdmin.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      setEditUser(null);
      setEditPassword("");
      setOriginalUser(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [search, setSearch] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editUser, setEditUser] = useState<null | {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    role: "USER" | "ADMIN";
    image?: string | null;
  }>(null);

  const filteredUsers = [...(users ?? [])]
    .filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username ?? "").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase() ?? "";
      const nameB = b.name?.toLowerCase() ?? "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() ?? "";
      setEditUser((prev) => (prev ? { ...prev, image: base64 } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleEditSave = () => {
    if (!editUser || !originalUser) return;

    const payload: {
      id: string;
      username?: string;
      name?: string;
      email?: string;
      role?: "USER" | "ADMIN";
      image?: string;
      password?: string;
    } = { id: editUser.id };

    // Include only changed fields
    if (editUser.username !== originalUser.username) {
      payload.username = editUser.username ?? "";
    }
    if (editUser.name !== originalUser.name) {
      payload.name = editUser.name ?? "";
    }
    if (editUser.email !== originalUser.email) {
      payload.email = editUser.email ?? "";
    }
    if (editUser.role !== originalUser.role) {
      payload.role = editUser.role;
    }
    if (editUser.image !== originalUser.image) {
      payload.image = editUser.image ?? undefined; // Backend expects string or undefined, not null
    }
    if (editPassword.trim().length > 0) {
      payload.password = editPassword.trim();
    }

    if (Object.keys(payload).length > 1) {
      updateUser.mutate(payload);
    } else {
      toast.info("No changes to save");
      setEditUser(null);
      setEditPassword("");
      setOriginalUser(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by name, email or username"
          className="max-w-xs bg-amber-50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent className="bg-amber-50">
            <CreateUserPage />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <Button
          variant="outline"
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          Sort {sortOrder === "asc" ? "A → Z" : "Z → A"}
        </Button>
        <table className="mt-3 min-w-full border bg-amber-50 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Image</th>
              <th className="p-2">Username</th>
              <th className="p-2">FullName</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">
                  <img
                    src={
                      user.image && user.image.trim() !== ""
                        ? user.image
                        : "/images/default.png"
                    }
                    alt={user.name ?? ""}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </td>
                <td className="p-2">{user.username}</td>
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.role}</td>

                <td className="space-x-2 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setOpen(true);
                    }}
                  >
                    <MedalIcon />
                  </Button>

                  <Dialog
                    open={!!editUser && editUser.id === user.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditUser(null);
                        setEditPassword("");
                        setOriginalUser(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditUser(user);
                          setOriginalUser(user);
                          setEditPassword("");
                        }}
                      >
                        <Pencil />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-amber-50">
                      <h2 className="mb-4 text-lg font-semibold">Edit User</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEditSave();
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="mb-1 block font-medium">
                            Username
                          </label>
                          <Input
                            value={editUser?.username ?? ""}
                            onChange={(e) =>
                              setEditUser((prev) =>
                                prev
                                  ? { ...prev, username: e.target.value }
                                  : null,
                              )
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-medium">Name</label>
                          <Input
                            value={editUser?.name ?? ""}
                            onChange={(e) =>
                              setEditUser((prev) =>
                                prev ? { ...prev, name: e.target.value } : null,
                              )
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-medium">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={editUser?.email ?? ""}
                            onChange={(e) =>
                              setEditUser((prev) =>
                                prev
                                  ? { ...prev, email: e.target.value }
                                  : null,
                              )
                            }
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-medium">
                            Password (leave blank to keep current)
                          </label>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            minLength={6}
                            placeholder="Enter new password"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-medium">Role</label>
                          <Select
                            value={editUser?.role ?? "USER"}
                            onValueChange={(val) =>
                              setEditUser((prev) =>
                                prev
                                  ? { ...prev, role: val as "USER" | "ADMIN" }
                                  : null,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageChange}
                            className="mb-2"
                          />
                          {editUser?.image && (
                            <img
                              src={editUser.image}
                              alt="Preview"
                              className="h-24 w-24 rounded object-cover"
                            />
                          )}
                          {editUser?.image && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditUser((prev) =>
                                  prev ? { ...prev, image: null } : null,
                                )
                              }
                              className="mt-2 bg-red-600 text-amber-50"
                            >
                              X
                            </Button>
                          )}
                        </div>

                        <div className="flex justify-end gap-2">
                          <DialogClose asChild>
                            <Button variant="outline" type="button">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button type="submit" disabled={updateUser.isPending}>
                            {updateUser.isPending ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteUser.mutate({ id: user.id })}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <Lottie
                      animationData={loading}
                      loop
                      autoplay
                      className="h-40 w-40"
                    />
                  </div>
                </td>
              </tr>
            ) : filteredUsers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-amber-50">
            <DialogTitle>User Medals</DialogTitle>
            {selectedUserId && (
              <UserMedalsDialog
                userId={selectedUserId}
                onClose={() => setOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
