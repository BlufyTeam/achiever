"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { X } from "lucide-react";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";

type Props = {
  userId: string;
  medalId: string;
  onClose: () => void;
};

// Define the expected shape of the vouch data
interface Vouch {
  id: string;
  userId: string;
  medalId: string;
  createdAt: Date;
  vouchedById: string;
  vouchedBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface VouchesQueryData {
  vouches: Vouch[];
  vouchCount: number;
}

export function MedalVouchesDialog({ userId, medalId, onClose }: Props) {
  const vouchesQuery = api.userMedal.getVouches.useQuery({ userId, medalId });

  useEffect(() => {
    // Refetch when dialog opens
    vouchesQuery.refetch();
  }, [userId, medalId]);

  if (vouchesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  if (vouchesQuery.error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
      </div>
    );
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Vouches for this medal</h2>

        {vouchesQuery.data?.vouches && vouchesQuery.data.vouches.length > 0 ? (
          <ul className="max-h-80 space-y-3 overflow-y-auto">
            {vouchesQuery.data.vouches.map((vouch) => (
              <li key={vouch.id} className="flex items-center gap-3">
                <img
                  src={vouch.vouchedBy.image ?? "/default-avatar.png"}
                  alt={vouch.vouchedBy.name}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="font-medium">{vouch.vouchedBy.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(vouch.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No vouches yet.</p>
        )}
        <Button variant="outline" className="mt-4" onClick={onClose}>
          <X />
        </Button>
      </div>
    </div>
  );
}
