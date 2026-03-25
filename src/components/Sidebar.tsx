"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Columns3,
  Calculator,
  Hammer,
  Users,
  DollarSign,
  Activity,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Deal Pipeline", icon: Columns3 },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/rehab", label: "Rehab Tracker", icon: Hammer },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/financials", label: "Financials", icon: DollarSign },
  { href: "/activity", label: "Activity", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-4 border-b border-dark-700">
        <h1 className="text-xl font-bold text-brand-500">D4D</h1>
        <p className="text-xs text-dark-400 mt-1">Mission Control</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-dark-300 hover:bg-dark-700 hover:text-dark-100"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-200">{user.name}</p>
              <p className="text-xs text-dark-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-dark-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg lg:hidden text-dark-300"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 flex flex-col transform transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-dark-400"
        >
          <X size={18} />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-dark-900 border-r border-dark-700">
        {navContent}
      </aside>
    </>
  );
}
