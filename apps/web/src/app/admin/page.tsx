"use client";

import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/Login";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between font-sans selection:bg-zinc-900 selection:text-white relative">
      {/* Background Grid Pattern (PocketBase Style) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
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

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 px-3 py-1.5 rounded-md transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Student Lobby
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 my-8">
        <LoginForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 font-mono bg-zinc-50/50">
        CodeGavel Admin Portal • Secure LAN Assessment Control
      </footer>
    </div>
  );
}
