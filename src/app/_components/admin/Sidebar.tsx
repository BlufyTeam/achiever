"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Medal,
  Logs,
  ChevronsLeft,
  ChevronsRight,
  Users,
  FileClock,
} from "lucide-react";

type SidebarProps = {
  onSelect: (value: string) => void;
};

export default function Sidebar({ onSelect }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    medals: false,
    categories: false,
    users: false,
    reports: false,
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 -right-4 z-10 rounded-full border border-gray-200 bg-white p-1 shadow transition hover:bg-gray-100"
      >
        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`min-h-full ${
          isCollapsed ? "w-14" : "w-64"
        } border-r bg-white p-4 shadow-sm transition-all duration-300`}
      >
        <nav className="space-y-2">
          {/* Medals */}
          <div>
            <button
              onClick={() => toggleMenu("medals")}
              className={`flex w-full items-center rounded px-2 py-2 text-left hover:bg-gray-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Medal
                className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} ${isCollapsed ? "mr-0" : "mr-2"}`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1">Medals</span>
                  {openMenus.medals ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </>
              )}
            </button>
            {!isCollapsed && openMenus.medals && (
              <div className="mt-1 space-y-1 pl-7">
                <button
                  onClick={() => onSelect("medals-create")}
                  className="block w-full text-left text-sm text-gray-700 hover:text-black"
                >
                  - Create Medal
                </button>
                <button
                  onClick={() => onSelect("medals-all")}
                  className="block w-full text-left text-sm text-gray-700 hover:text-black"
                >
                  - All Medals
                </button>
                <button
                  onClick={() => onSelect("collection")}
                  className="block w-full text-left text-sm text-gray-700 hover:text-black"
                >
                  - Collections
                </button>
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <button
              onClick={() => onSelect("categories-all")}
              className={`flex w-full items-center rounded px-2 py-2 text-left hover:bg-gray-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Logs
                className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} ${isCollapsed ? "mr-0" : "mr-2"}`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1">Categories</span>
                </>
              )}
            </button>
          </div>
          {/* users */}
          <div>
            <button
              onClick={() => {
                onSelect("users-all");
              }}
              className={`flex w-full items-center rounded px-2 py-2 text-left hover:bg-gray-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <Users
                className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} ${isCollapsed ? "mr-0" : "mr-2"}`}
              />
              {!isCollapsed && <span className="flex-1">Users</span>}
            </button>
          </div>
          {/*reports */}
          <div>
            <button
              onClick={() => toggleMenu("reports")}
              className={`flex w-full items-center rounded px-2 py-2 text-left hover:bg-gray-100 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <FileClock
                className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} ${isCollapsed ? "mr-0" : "mr-2"}`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1">Reports</span>
                  {openMenus.reports ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </>
              )}
            </button>
            {!isCollapsed && openMenus.reports && (
              <div className="mt-1 space-y-1 pl-7">
                <button
                  onClick={() => onSelect("gifts")}
                  className="block w-full text-left text-sm text-gray-700 hover:text-black"
                >
                  - Gifts
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </div>
  );
}
