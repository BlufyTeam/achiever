"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";

export default function SearchInput() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // debounce input (wait 500ms after last keystroke)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // call API
  const { data: users, isLoading: loadingUsers } = api.user.search.useQuery(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  const { data: medals, isLoading: loadingMedals } = api.medals.search.useQuery(
    { q: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  const handleUserSelect = (username: string) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/u/${username}`);
  };

  const handleMedalSelect = (id: string) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/medal/${id}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Search users or medals..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        className="w-full rounded-2xl border border-gray-300 bg-amber-50 py-2 pr-4 pl-10 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {showDropdown && query.length > 0 && (
        <div className="absolute z-10 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {/* USERS */}
          <div>
            <h3 className="px-4 pt-2 text-xs font-semibold text-gray-400">
              Users
            </h3>
            {loadingUsers && (
              <div className="p-3 text-sm text-gray-500">Searching...</div>
            )}
            {!loadingUsers && users?.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No users found</div>
            )}
            {users?.slice(0, 5).map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user.username)}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
              >
                <img
                  src={
                    user.image && user.image.trim() !== ""
                      ? user.image
                      : "/images/default.png"
                  }
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {user.username}
                  </span>
                  {user.name && (
                    <span className="text-sm text-gray-500">{user.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* MEDALS */}
          <div className="border-t border-gray-200">
            <h3 className="px-4 pt-2 text-xs font-semibold text-gray-400">
              Medals
            </h3>
            {loadingMedals && (
              <div className="p-3 text-sm text-gray-500">Searching...</div>
            )}
            {!loadingMedals && medals?.length === 0 && (
              <div className="p-3 text-sm text-gray-500">No medals found</div>
            )}
            {medals?.slice(0, 5).map((medal) => (
              <div
                key={medal.id}
                onClick={() => handleMedalSelect(medal.id)}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-100"
              >
                <img
                  src={
                    medal.image && medal.image.trim() !== ""
                      ? medal.image
                      : "/images/default.png"
                  }
                  alt={medal.name}
                  className="h-8 w-8 rounded object-cover"
                />
                <span className="font-medium text-gray-800">{medal.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
