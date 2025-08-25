"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import type { ChangeEvent, FormEvent } from "react";
import Select from "react-select";

export default function CreateMedalPage() {
  const utils = api.useUtils();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [tasks, setTasks] = useState<{ title: string; description: string }[]>(
    [],
  );

  const { data: categories = [] } = api.category.getAll.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const createMedal = api.medals.create.useMutation({
    onSuccess: async () => {
      await utils.medals.invalidate();
      toast.success("Medal created successfully!");
      setName("");
      setDescription("");
      setImage("");
      setSelectedCategories([]);
      setTasks([]);
    },
    onError: () => {
      toast.error("Failed to create medal");
    },
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string); // base64
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    createMedal.mutate({
      name,
      description,
      image,
      categoryIds: selectedCategories.map((c) => c.value),
      tasks,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-muted mx-auto w-full max-w-lg space-y-6 rounded-lg border bg-amber-50 p-6 shadow-md"
    >
      <h1 className="text-2xl font-semibold">Create New Medal</h1>

      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Image</Label>
        <Input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div className="mt-2 space-y-2">
            <img src={image} alt="Preview" className="h-24 rounded border" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setImage("")}
            >
              <X />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Assign Categories</Label>
        <Select
          isMulti
          options={categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
          }))}
          value={selectedCategories}
          onChange={(val) => setSelectedCategories(val as any)}
          className="text-black"
        />
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-lg font-semibold">Add Tasks</h3>

        <div className="space-y-2">
          <Label>Task Title</Label>
          <Input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title"
          />

          <Label>Task Description</Label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Optional description"
          />

          <Button
            type="button"
            onClick={() => {
              if (taskTitle.trim()) {
                setTasks([
                  ...tasks,
                  { title: taskTitle, description: taskDescription },
                ]);
                setTaskTitle("");
                setTaskDescription("");
              }
            }}
          >
            Add Task
          </Button>
        </div>

        {tasks.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Tasks Preview</h4>
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded bg-gray-100 p-2"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setTasks(tasks.filter((_, i) => i !== idx));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={createMedal.isPending}>
        {createMedal.isPending ? "Creating..." : "Create Medal"}
      </Button>
    </form>
  );
}
