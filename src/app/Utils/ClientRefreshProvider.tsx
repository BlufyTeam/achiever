"use client";

import dynamic from "next/dynamic";
import PullToRefresh from "react-pull-to-refresh";
import type { ReactNode } from "react";
import Lottie from "lottie-react";
import loading from "~/animations/loading.json";

interface PullToRefreshWrapperProps {
  onRefresh?: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  distanceToRefresh?: number;
  resistance?: number;
}

const PullToRefreshWrapper = dynamic(() => import("./RefreshProvider"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center">
      <Lottie animationData={loading} className="h-14 w-14" loop autoplay />
    </div>
  ),
});

export default function PullToRefreshClientProvider(
  props: PullToRefreshWrapperProps,
) {
  return <PullToRefreshWrapper {...props} />;
}
