"use client";

import { FileCode2, LogOut, Terminal, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Adjust path if needed
import { authService } from "@/lib/services/auth-services";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push("/admin");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 p-1.5 rounded-md text-white">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-900">CodeGavel</span>
            <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-medium">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              pathname.startsWith("/admin/dashboard")
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Classes & Monitoring
          </Link>
          <Link
            href="/admin/problems"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              pathname.startsWith("/admin/problems")
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" /> Problem Bank
          </Link>
        </nav>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="text-zinc-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
      >
        <LogOut className="w-3.5 h-3.5" /> Sign Out
      </Button>
    </header>
  );
}
