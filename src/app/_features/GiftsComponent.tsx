"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { Check, PlusIcon, X } from "lucide-react";

export default function ReceivedGiftsPage() {
  const utils = api.useUtils();

  const {
    data: gifts,
    isLoading,
    refetch,
  } = api.gift.getReceivedGifts.useQuery();

  const [processingGiftId, setProcessingGiftId] = useState<string | null>(null);

  const acceptGiftMutation = api.gift.acceptGift.useMutation({
    onSuccess: () => {
      utils.gift.getReceivedGifts.invalidate();
    },
  });

  const rejectGiftMutation = api.gift.rejectGift.useMutation({
    onSuccess: () => {
      utils.gift.getReceivedGifts.invalidate();
    },
  });

  const handleAccept = async (giftId: string) => {
    setProcessingGiftId(giftId);

    // Optimistically remove from UI
    utils.gift.getReceivedGifts.setData(undefined, (old) =>
      (old ?? []).filter((g) => g.id !== giftId),
    );

    try {
      await acceptGiftMutation.mutateAsync({ giftId });
    } catch (e) {
      console.error(e);
      await refetch();
    } finally {
      setProcessingGiftId(null);
    }
  };

  const handleReject = async (giftId: string) => {
    setProcessingGiftId(giftId);

    // Optimistically remove from UI
    utils.gift.getReceivedGifts.setData(undefined, (old) =>
      (old ?? []).filter((g) => g.id !== giftId),
    );

    try {
      await rejectGiftMutation.mutateAsync({ giftId });
    } catch (e) {
      console.error(e);
      await refetch();
    } finally {
      setProcessingGiftId(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-5 font-sans">
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Lottie animationData={loading} className="h-24 w-24" loop autoplay />
        </div>
      ) : (gifts ?? []).length === 0 ? (
        <p className="col-span-full text-center text-gray-400">
          You have no pending gifts.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(gifts ?? []).map((gift) => (
            <div
              key={gift.id}
              className="flex min-w-50 flex-col items-center rounded-lg bg-amber-50 p-4 shadow-lg transition hover:shadow-xl"
            >
              {/* Medal Image */}
              {gift.medal.image ? (
                <img
                  src={gift.medal.image ?? "/images/default.png"}
                  alt={gift.medal.name}
                  className="mb-3 h-24 w-24 rounded object-contain"
                />
              ) : (
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded bg-gray-300 text-gray-600">
                  No Image
                </div>
              )}

              {/* Medal Name */}
              <h2 className="text-center text-lg font-semibold text-gray-900">
                {gift.medal.name}
              </h2>

              {/* Medal Description */}
              {gift.medal.description && (
                <p className="mt-1 text-center text-sm text-gray-700">
                  {gift.medal.description}
                </p>
              )}

              {/* Gift Message */}
              {gift.message && (
                <p className="mt-2 text-center text-sm text-gray-600 italic">
                  "{gift.message}"
                </p>
              )}

              {/* Gifted By */}
              {gift.giftedBy && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
                  <img
                    src={
                      gift.giftedBy.image
                        ? gift.giftedBy.image
                        : "/images/default.png"
                    }
                    alt={gift.giftedBy.username}
                    className="h-6 w-6 rounded-full object-cover"
                  />

                  <span>
                    Gifted by{" "}
                    <span className="font-semibold">
                      {gift.giftedBy.username}
                    </span>
                  </span>
                </div>
              )}

              {/* Created Date */}
              <p className="mt-2 text-xs text-gray-500">
                {new Date(gift.createdAt).toLocaleDateString()}
              </p>

              {/* Accept / Reject Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAccept(gift.id)}
                  disabled={processingGiftId === gift.id}
                  className={`rounded px-3 py-1 font-semibold text-white ${
                    processingGiftId === gift.id
                      ? "cursor-not-allowed bg-green-300"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  <Check></Check>
                </button>
                <button
                  onClick={() => handleReject(gift.id)}
                  disabled={processingGiftId === gift.id}
                  className={`rounded border px-3 py-1 font-semibold ${
                    processingGiftId === gift.id
                      ? "cursor-not-allowed border-red-300 text-red-300"
                      : "border-red-500 text-red-500 hover:bg-red-100"
                  }`}
                >
                  <X></X>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
