"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";

type Props = {
  onCreated: () => void;
};

export function CreateCategoryForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createCategory = api.category.create.useMutation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string); // base64 string
    };
    reader.readAsDataURL(file); // ✅ this gives base64
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    // 👇 simulate image uploading — replace with real upload logic
    let imageUrl: string | undefined;
    if (imageFile) {
      imageUrl = imagePreview ?? undefined;
      // In production, you'd upload to Cloudinary, S3, etc., and get the real URL.
    }

    try {
      await createCategory.mutateAsync({ name, image: imageUrl });
      toast.success("Category created");
      setName("");
      setImageFile(null);
      setImagePreview(null);
      onCreated();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create category");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 h-24 w-24 rounded object-cover"
          />
        )}
      </div>

      <Button type="submit" disabled={createCategory.isPending}>
        {createCategory.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
