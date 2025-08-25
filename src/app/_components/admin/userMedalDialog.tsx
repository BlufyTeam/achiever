"use client";

import { useState } from "react";
import { toast } from "sonner";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";
import { api } from "~/trpc/react";
import { MedalVouchesDialog } from "./MedalVouchesDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  userId: string;
  onClose?: () => void;
};

export function UserMedalsDialog({ userId, onClose }: Props) {
  const userMedalsQuery = api.userMedal.getUserMedals.useQuery({ userId });
  const { data: allMedals = [] } = api.medals.getAll.useQuery();
  const [vouchesFor, setVouchesFor] = useState<string | null>(null);
  const [selectedMedalId, setSelectedMedalId] = useState<string | null>(null);

  const addMedal = api.userMedal.addUserMedal.useMutation({
    onSuccess: () => {
      toast.success("Medal added");
      setSelectedMedalId(null);
      userMedalsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMedal = api.userMedal.deleteUserMedal.useMutation({
    onSuccess: () => {
      toast.success("Medal removed");
      userMedalsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const medals = userMedalsQuery.data?.medals ?? [];
  const medalCount = userMedalsQuery.data?.medalCount ?? 0;

  if (userMedalsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Lottie animationData={loading} className="h-24 w-24" loop autoplay />
      </div>
    );
  } else
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">
          🏅 Total Medals: <span className="font-semibold">{medalCount}</span>
        </div>

        {medals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No medals assigned.</p>
        ) : (
          <ul className="space-y-2">
            {medals.map(({ medal }) => (
              <li
                key={medal.id}
                className="flex items-center justify-between gap-2"
              >
                <span>{medal.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMedal.isPending}
                    onClick={() =>
                      deleteMedal.mutate({ userId, medalId: medal.id })
                    }
                  >
                    <Trash2></Trash2>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVouchesFor(medal.id)}
                  >
                    Vouches
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end gap-2">
          <Select
            onValueChange={(val) => setSelectedMedalId(val)}
            value={selectedMedalId ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select medal to add" />
            </SelectTrigger>
            <SelectContent>
              {allMedals.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!selectedMedalId || addMedal.isPending}
            onClick={() =>
              selectedMedalId &&
              addMedal.mutate({ userId, medalId: selectedMedalId })
            }
          >
            Add
          </Button>
        </div>
        {vouchesFor && (
          <MedalVouchesDialog
            userId={userId}
            medalId={vouchesFor}
            onClose={() => setVouchesFor(null)}
          />
        )}
      </div>
    );
}
