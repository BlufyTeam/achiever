"use client";

import PullToRefresh from "react-pull-to-refresh";
import type { ReactNode } from "react";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";
import { useState } from "react";

interface PullToRefreshWrapperProps {
  onRefresh?: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  distanceToRefresh?: number;
  resistance?: number;
}

export default function PullToRefreshContent({
  onRefresh,
  children,
  disabled = false,
  distanceToRefresh = 70,
  resistance = 2.5,
}: PullToRefreshWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);

  const defaultRefresh = async () => {
    if (typeof window !== "undefined") {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          window.location.reload();
          resolve();
        }, 500);
      });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);

    // This is the key change: use Promise.all to ensure a minimum display time
    await Promise.all([
      onRefresh ? onRefresh() : defaultRefresh(),
      new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms delay
    ]);

    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className="flex justify-center">
          <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
        </div>
      )}
      <PullToRefresh
        onRefresh={handleRefresh}
        className="relative w-full"
        disabled={disabled}
        distanceToRefresh={distanceToRefresh}
        resistance={resistance}
      >
        {children}
      </PullToRefresh>
    </>
  );
}
