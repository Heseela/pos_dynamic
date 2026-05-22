"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Zap,
  Package,
  FileText,
  TrendingUp,
  ShoppingBag,
  Building2,
  LogOut,
  ChevronRight,
  Store,
  ChevronLeft,
  Tags,
  Box,
  Archive,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const menuSections = [
    {
      title: "Main",
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          path: "/",
          roles: ["admin", "branch_head", "cashier", "worker"],
        },
        {
          icon: Zap,
          label: "Orders/KOT",
          path: "/pos",
          roles: ["admin", "branch_head", "cashier", "worker"],
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          icon: Package,
          label: "Inventory",
          path: "/inventory",
          roles: ["admin", "branch_head"],
        },
        {
          icon: Tags,
          label: "Categories",
          path: "/categories",
          roles: ["admin", "branch_head"],
        },
        {
          icon: Box,
          label: "Products",
          path: "/products",
          roles: ["admin", "branch_head"],
        },
        {
          icon: Package,
          label: "Suppliers",
          path: "/suppliers",
          roles: ["admin", "branch_head"],
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          icon: FileText,
          label: "Ledgers",
          path: "/ledgers",
          roles: ["admin", "branch_head"],
        },
        {
          icon: ShoppingBag,
          label: "Purchase",
          path: "/purchase",
          roles: ["admin", "branch_head"],
        },
        {
          icon: Archive,
          label: "Saved Bills",
          path: "/pos/saved-bills",
          roles: ["admin", "branch_head", "cashier", "worker"],
        },
      ],
    },
    {
      title: "Analytics",
      items: [
        {
          icon: TrendingUp,
          label: "Reports",
          path: "/reports",
          roles: ["admin", "branch_head"],
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          icon: Building2,
          label: "Branches",
          path: "/branches",
          roles: ["admin"],
        },
      ],
    },
  ];

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        user?.role?.some((userRole) => item.roles.includes(userRole))
      ),
    }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    const nav = document.querySelector('.sidebar-nav');
    if (nav) {
      const checkScroll = () => {
        const hasScroll = nav.scrollHeight > nav.clientHeight;
        const isAtBottom = nav.scrollHeight - nav.scrollTop - nav.clientHeight < 5;
        setShowScrollIndicator(hasScroll && !isAtBottom);
      };
      
      checkScroll();
      nav.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        nav.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [filteredSections]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={`bg-linear-to-b from-[#0f0f0f] via-[#0a0a0a] to-black h-screen flex flex-col border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-70"
      }`}
    >
      <div className="flex flex-col h-full">
        <div
          className={`px-6 py-6 flex items-center ${
            isCollapsed ? "justify-center px-4" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-linear-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                <Store className="w-6 h-6 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Savory
                </h1>
                <p className="text-[10px] text-gray-600 font-semibold tracking-wider uppercase mt-0.5">
                  POS System
                </p>
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-gray-400 hover:text-white transition-all duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={2.5} />
            ) : (
              <ChevronLeft size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <nav className="sidebar-nav h-full px-3 py-4 overflow-y-auto scrollbar-none">
            <div className="space-y-4">
            {filteredSections.map((section, sectionIndex) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <div className="px-4 mb-2">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  {section.items.map((item, itemIndex) => {
                    const isActive = pathname === item.path;
                    const globalIndex = sectionIndex * 10 + itemIndex;
                    const isHovered = hoveredItem === globalIndex;
                    const Icon = item.icon;
                    return (
                      <div key={item.path} className="relative">
                        <Link
                          href={item.path}
                          onMouseEnter={() => setHoveredItem(globalIndex)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`group flex items-center ${
                            isCollapsed ? "justify-center" : "justify-between"
                          } px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-white text-black shadow-lg"
                              : "text-gray-400 hover:text-white hover:bg-white/8"
                          }`}
                        >
                          <div
                            className={`flex items-center ${
                              isCollapsed ? "" : "gap-3"
                            }`}
                          >
                            <Icon
                              size={20}
                              strokeWidth={2.5}
                              className={
                                isActive
                                  ? "text-black"
                                  : "text-gray-500 group-hover:text-white"
                              }
                            />
                            {!isCollapsed && (
                              <span className="text-sm font-semibold">
                                {item.label}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && isActive && (
                            <ChevronRight
                              size={16}
                              className="text-black"
                              strokeWidth={3}
                            />
                          )}
                        </Link>

                        {isCollapsed && isHovered && (
                          <div
                            className="fixed left-22 z-9999 pointer-events-none"
                            style={{ top: `${globalIndex * 58 + 140}px` }}
                          >
                            <div className="bg-gray-900 text-white text-sm font-semibold px-3 py-2 rounded-lg shadow-xl border border-white/5 whitespace-nowrap">
                              {item.label}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
          
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />
        )}
        </div>

        <div className="p-4 border-t border-white/6">
          {!isCollapsed ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3.5 mb-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 bg-linear-to-br from-white to-gray-200 rounded-full flex items-center justify-center text-black text-sm font-black shadow-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {user?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-500 truncate font-medium">
                      {user?.branch}
                    </span>
                    <span className="px-2 py-0.5 bg-linear-to-r from-blue-500/20 to-purple-500/20 text-blue-400 text-[9px] font-black rounded-md uppercase tracking-wider border border-blue-500/20">
                      {user?.role?.join(", ").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-11 h-11 bg-linear-to-br from-white to-gray-200 rounded-full flex items-center justify-center text-black text-sm font-black shadow-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-lg" />
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center" : "justify-center"
            } gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-white/10 hover:border-white/20 group`}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut
              size={16}
              strokeWidth={2.5}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
