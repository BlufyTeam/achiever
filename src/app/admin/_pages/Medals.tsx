import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import {
  ListCheck,
  Pencil,
  Trash,
  UsersRound,
  Table,
  List,
} from "lucide-react";
import Select from "react-select";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type MedalStatus = "EARNABLE" | "GIFT_ONLY" | "UNAVAILABLE";

export default function MedalsPage() {
  const { data: medals = [], isLoading } = api.medals.getAll.useQuery();
  const { data: categories = [] } = api.category.getAll.useQuery();
  const utils = api.useUtils();

  const [editMedal, setEditMedal] = useState<(typeof medals)[0] | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editCategories, setEditCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [editStatus, setEditStatus] = useState<MedalStatus>("EARNABLE");

  // --- TASKS DIALOG STATES ---
  const [tasksDialogMedal, setTasksDialogMedal] = useState<
    (typeof medals)[0] | null
  >(null);
  const [tasks, setTasks] = useState<{ title: string; description?: string }[]>(
    [],
  );
  const [taskEditIndex, setTaskEditIndex] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  // Mutation hooks
  const updateMedal = api.medals.update.useMutation({
    onSuccess: () => {
      toast.success("Medal updated");
      utils.medals.getAll.invalidate();
    },
    onError: () => toast.error("Failed to update medal"),
  });

  const deleteMedal = api.medals.delete?.useMutation({
    onSuccess: () => {
      toast.success("Medal deleted");
      utils.medals.getAll.invalidate();
    },
    onError: () => toast.error("Error deleting medal"),
  });

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<
    { value: string; label: string }[]
  >([]);

  // Filter medals by search and category
  const filtered = useMemo(() => {
    return medals
      .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
      .filter((m) =>
        selectedCats.length === 0
          ? true
          : m.categories.some((c) =>
              selectedCats.map((sc) => sc.value).includes(c.category.id),
            ),
      );
  }, [medals, search, selectedCats]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete?")) {
      deleteMedal?.mutate({ id });
    }
  };

  function normalizeTasks(
    tasks:
      | {
          id: string;
          title: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
          medalId: string;
        }[]
      | undefined,
  ): { title: string; description?: string }[] {
    if (!tasks) return [];
    return tasks.map(({ title, description }) => ({
      title,
      description: description ?? undefined,
    }));
  }

  const openTasksDialog = (medal: (typeof medals)[0]) => {
    setTasksDialogMedal(medal);
    setTasks(normalizeTasks(medal.tasks));
    setTaskEditIndex(null);
    setTaskTitle("");
    setTaskDescription("");
  };

  const saveTasks = () => {
    if (!tasksDialogMedal) return;
    updateMedal.mutate({
      id: tasksDialogMedal.id,
      name: tasksDialogMedal.name,
      description: tasksDialogMedal.description ?? "",
      image: tasksDialogMedal.image ?? "",
      categoryIds: tasksDialogMedal.categories.map((c) => c.category.id),
      tasks: tasks,
      status: tasksDialogMedal.status as MedalStatus,
    });
    setTasksDialogMedal(null);
  };

  const addOrUpdateTask = () => {
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (taskEditIndex !== null) {
      const newTasks = [...tasks];
      newTasks[taskEditIndex] = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
      };
      setTasks(newTasks);
    } else {
      setTasks([
        ...tasks,
        { title: taskTitle.trim(), description: taskDescription.trim() },
      ]);
    }
    setTaskTitle("");
    setTaskDescription("");
    setTaskEditIndex(null);
  };

  const editTask = (index: number) => {
    const task = tasks[index];
    setTaskEditIndex(index);
    setTaskTitle(task?.title ?? "");
    setTaskDescription(task?.description ?? "");
  };

  const deleteTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
    if (taskEditIndex === index) {
      setTaskEditIndex(null);
      setTaskTitle("");
      setTaskDescription("");
    }
  };

  const statusOptions: { value: MedalStatus; label: string }[] = [
    { value: "EARNABLE", label: "Earnable" },
    { value: "GIFT_ONLY", label: "Gift Only" },
    { value: "UNAVAILABLE", label: "Unavailable" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-8">
      {/* Controls */}
      <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("card")}
            variant={viewMode === "card" ? "default" : "outline"}
          >
            <Table />
          </Button>
          <Button
            onClick={() => setViewMode("list")}
            variant={viewMode === "list" ? "default" : "outline"}
          >
            <List />
          </Button>
        </div>
        <Input
          placeholder="Search medals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-amber-50"
        />
        <div className="w-64">
          <Select
            isMulti
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={selectedCats}
            onChange={(val) => setSelectedCats(val as any)}
            placeholder="Filter by categories"
          />
        </div>
      </div>

      {/* List or card view */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Lottie animationData={loading} className="h-32 w-32" loop autoplay />
        </div>
      ) : filtered.length === 0 ? (
        <p>No medals found.</p>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.id} className="bg-amber-50 shadow">
              <CardHeader>
                <CardTitle>{m.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-48 w-full rounded object-contain"
                  />
                ) : (
                  <div className="h-48 rounded bg-gray-200" />
                )}
                <p className="mt-2 text-sm text-gray-600">{m.description}</p>
                <p className="mt-1 text-xs font-semibold text-blue-600">
                  Status: {m.status}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.categories.map(({ category }) => (
                    <span
                      key={category.id}
                      className="rounded border-1 bg-gray-100 py-1 text-xs"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex">
                  <UsersRound />
                  <p className="ml-2 text-sm font-medium text-gray-700">
                    {m._count?.users ?? 0}
                    {m._count?.users === 1 ? "" : "s"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setEditMedal(m);
                    setEditName(m.name);
                    setEditDescription(m.description || "");
                    setEditCategories(
                      m.categories.map((c) => ({
                        value: c.category.id,
                        label: c.category.name,
                      })),
                    );
                    setEditImage(m.image ?? null);
                    setEditStatus(
                      (
                        ["EARNABLE", "GIFT_ONLY", "UNAVAILABLE"] as const
                      ).includes(m.status as MedalStatus)
                        ? (m.status as MedalStatus)
                        : "EARNABLE",
                    );
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash className="text-red-500" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => openTasksDialog(m)}
                  title="Manage Tasks"
                >
                  <ListCheck />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2"></th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Categories</th>
              <th>Actions</th>
              <th>
                <UsersRound />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-b hover:border-2 hover:border-orange-600"
              >
                <td className="px-2 py-2">
                  {m.image ? (
                    <img
                      src={m.image}
                      alt={m.name}
                      className="h-10 w-full rounded object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200" />
                  )}
                </td>
                <td>{m.name}</td>
                <td>{m.description}</td>
                <td className="font-semibold text-blue-600">{m.status}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {m.categories.map(({ category }) => (
                      <span
                        key={category.id}
                        className="rounded bg-gray-100 px-2 py-1 text-xs"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditMedal(m);
                      setEditName(m.name);
                      setEditDescription(m.description || "");
                      setEditCategories(
                        m.categories.map((c) => ({
                          value: c.category.id,
                          label: c.category.name,
                        })),
                      );
                      setEditImage(m.image ?? null);
                      setEditStatus(
                        (
                          ["EARNABLE", "GIFT_ONLY", "UNAVAILABLE"] as const
                        ).includes(m.status as MedalStatus)
                          ? (m.status as MedalStatus)
                          : "EARNABLE",
                      );
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash className="text-red-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openTasksDialog(m)}
                    title="Manage Tasks"
                  >
                    <ListCheck />
                  </Button>
                </td>
                <td>{m._count?.users ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Medal Modal */}
      {editMedal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold">Edit Medal</h2>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
            />
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              className="mt-2"
            />
            <Select
              isMulti
              className="mt-2"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={editCategories}
              onChange={(val) => setEditCategories(val as any)}
            />
            <Select
              className="mt-2"
              options={statusOptions}
              value={statusOptions.find((s) => s.value === editStatus)}
              onChange={(val) => setEditStatus(val?.value ?? "EARNABLE")}
              placeholder="Select status"
            />

            {/* Image preview and upload */}
            {editImage ? (
              <div className="relative mt-4 h-48 w-full">
                <img
                  src={editImage}
                  alt="Selected"
                  className="h-full w-full rounded border object-contain"
                />
                <button
                  onClick={() => setEditImage(null)}
                  className="absolute top-1 right-1 rounded bg-red-500 px-2 py-1 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = reader.result?.toString();
                    if (base64) setEditImage(base64);
                  };
                  reader.readAsDataURL(file);
                }}
                className="mt-4"
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditMedal(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateMedal.mutate({
                    id: editMedal.id,
                    name: editName,
                    description: editDescription,
                    categoryIds: editCategories.map((c) => c.value),
                    image: editImage ?? "",
                    tasks: tasks,
                    status: editStatus,
                  });
                  setEditMedal(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Dialog */}
      {tasksDialogMedal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">
              Manage Tasks for "{tasksDialogMedal.name}"
            </h2>
            {tasks.length === 0 && <p className="mb-4">No tasks added yet.</p>}
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className="mb-3 flex items-center justify-between rounded border p-2"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editTask(idx)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTask(idx)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-4 space-y-2 border-t pt-4">
              <Input
                placeholder="Task Title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <Input
                placeholder="Task Description (optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                {taskEditIndex !== null && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTaskEditIndex(null);
                      setTaskTitle("");
                      setTaskDescription("");
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button onClick={addOrUpdateTask}>
                  {taskEditIndex !== null ? "Update Task" : "Add Task"}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTasksDialogMedal(null)}
              >
                Close
              </Button>
              <Button onClick={saveTasks}>Save Tasks</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
