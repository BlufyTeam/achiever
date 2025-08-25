"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import loading from "~/animations/loading.json";
import Lottie from "lottie-react";

export default function GiftReportPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hasRun, setHasRun] = useState(false); // just to know if "Run" was clicked

  const [queryParams, setQueryParams] = useState<{
    from?: string;
    to?: string;
    user?: string;
    sort: "asc" | "desc";
  }>({
    sort: "desc",
  });

  const {
    data: gifts,
    isLoading,
    refetch,
  } = api.gift.getAllGiftedMedals.useQuery(queryParams, {
    enabled: false, // disabled by default
  });

  const handleRunClick = () => {
    setQueryParams({
      from: startDate || undefined,
      to: endDate || undefined,
      user: searchTerm || undefined,
      sort: sortOrder,
    });
    setHasRun(true);
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Gifts Report</h1>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          From:
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="max-w-[200px] bg-amber-50"
          />
        </div>
        <div>
          To:
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="max-w-[200px] bg-amber-50"
          />
        </div>
        <Input
          type="text"
          placeholder="Search by username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-[240px] bg-amber-50"
        />
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          Sort: {sortOrder === "asc" ? "Oldest" : "Newest"}
        </Button>
        <Button onClick={handleRunClick}>Run</Button>
      </div>

      {!hasRun ? (
        <p className="text-muted-foreground pt-6 italic">
          Click "Run" to load data.
        </p>
      ) : isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader className="animate-spin" size={18} />
          <div className="flex items-center justify-center py-12">
            <Lottie
              animationData={loading}
              className="h-14 w-14"
              loop
              autoplay
            />
          </div>
        </div>
      ) : (gifts ?? []).length === 0 ? (
        <p className="text-muted-foreground pt-4">No gifts found.</p>
      ) : (
        <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {(gifts ?? []).map((gift) => (
            <Card key={gift.id}>
              <CardHeader>
                <CardTitle className="text-lg">🎖 {gift.medal.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>
                  <strong>Sender:</strong>{" "}
                  <span className="text-primary">
                    {gift.giftedBy?.username || "Unknown"}
                  </span>
                </div>
                <div>
                  <strong>Receiver:</strong>{" "}
                  <span className="text-primary">
                    {gift.giftedTo?.username || "Unknown"}
                  </span>
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Badge
                    className={
                      gift.status === "ACCEPTED"
                        ? "bg-green-500 text-white"
                        : gift.status === "REJECTED"
                          ? "bg-red-500 text-white"
                          : "border border-gray-300"
                    }
                  >
                    {gift.status}
                  </Badge>
                </div>
                <div>
                  <strong>Gifted at:</strong>{" "}
                  {format(new Date(gift.createdAt), "yyyy-MM-dd HH:mm")}
                </div>
                {gift.acceptedAt && (
                  <div>
                    <strong>Accepted at:</strong>{" "}
                    {format(new Date(gift.acceptedAt), "yyyy-MM-dd HH:mm")}
                  </div>
                )}
                {gift.message && (
                  <div>
                    <strong>Message:</strong>{" "}
                    <div className="text-muted-foreground italic">
                      {gift.message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
