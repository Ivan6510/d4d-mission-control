"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { seedIfNeeded } from "@/lib/store";
import Sidebar from "@/components/Sidebar";

function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    seedIfNeeded();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      const stored = localStorage.getItem("d4d_user");
      if (!stored) {
        router.replace("/login");
      }
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-brand-500 text-xl font-bold animate-pulse">D4D</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
