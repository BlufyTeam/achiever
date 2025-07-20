"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react"; // adjust to your tRPC hook location
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const createCategory = api.category.create.useMutation(); // assumes you have this

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createCategory.mutateAsync({ name });
      alert("created");
      setName("");
    } catch (error) {
      console.error("Error creating category", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded border bg-amber-50 p-4 shadow">
      <h1 className="mb-4 text-xl font-semibold">Create New Category</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700">
            Name
          </Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          {loading ? "Creating..." : "Create Category"}
        </button>
      </form>
    </div>
  );
}
