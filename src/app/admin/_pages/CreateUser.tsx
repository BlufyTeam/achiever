"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";

export default function CreateUserPage() {
  const [form, setForm] = useState<{
    username: string;
    name: string;
    email: string;
    password: string;
    image?: string;
    role: "USER" | "ADMIN";
  }>({
    username: "",
    name: "",
    email: "",
    password: "",
    image: "",
    role: "USER",
  });

  const [preview, setPreview] = useState<string | null>(null);

  const signupMutation = api.user.signup.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      setForm({
        username: "",
        name: "",
        email: "",
        password: "",
        image: "",
        role: "USER",
      });
      setPreview(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() ?? "";
      setForm((prev) => ({ ...prev, image: base64 }));
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const uname = form.username.trim();
    if (uname.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    signupMutation.mutate({
      username: uname,
      name: form.name,
      email: form.email,
      password: form.password,
      image: form.image,
      role: form.role,
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6 bg-amber-50 p-6">
      <h1 className="text-2xl font-semibold">Create New User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input
            placeholder="username"
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <Label>Role</Label>
          <Select
            value={form.role}
            onValueChange={(val) =>
              setForm((p) => ({ ...p, role: val as "USER" | "ADMIN" }))
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
          <Label>Image (optional)</Label>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
          {preview && (
            <div className="mt-2 space-y-2">
              <img
                src={preview}
                alt="Preview"
                className="h-24 w-24 rounded object-cover"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm((p) => ({ ...p, image: "" }));
                  setPreview(null);
                }}
              >
                Remove Image
              </Button>
            </div>
          )}
        </div>

        <Button type="submit" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </form>
    </div>
  );
}
