"use client";

import { Code2, Shield, UserCheck } from "lucide-react";
import Link from "next/link";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { Header } from "@/components/landing/Header";
import { JoinExamForm } from "@/components/landing/JoinExamForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between font-sans selection:bg-zinc-900 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Local LAN Assessment Engine
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.15]">
            Minimalist, Secure C Programming Exams.
          </h1>

          <p className="text-base text-zinc-600 max-w-xl leading-relaxed">
            CodeGavel is a lightweight local laboratory tool. It enforces controlled access, auto-evaluates test cases,
            and offers real-time monitoring for automated coding assessments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <FeatureCard
              icon={<Code2 className="w-4 h-4 text-zinc-900" />}
              title="GCC Sandbox"
              description="Native compilation with isolated automated test assertions."
              tag="C / GCC"
            />
            <FeatureCard
              icon={<Shield className="w-4 h-4 text-zinc-900" />}
              title="Anti-Cheat Guard"
              description="Focus switch tracking with 3-strike policy lockouts."
              tag="STRIKER"
            />
            <FeatureCard
              icon={<UserCheck className="w-4 h-4 text-zinc-900" />}
              title="SSE Realtime"
              description="Instant lockstep state syncing powered by PocketBase."
              tag="LIVE"
            />
          </div>
        </div>

        <div className="w-full max-w-md">
          <JoinExamForm />
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200 bg-zinc-50/50 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-zinc-900">CodeGavel</span>
            <span className="text-zinc-300">•</span>
            <span>Lightweight Automated Assessment Engine</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Developed by:</span>
            <Link
              href="https://cjabendan.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-900 hover:text-zinc-600 decoration-zinc-300 underline-offset-4 transition-colors"
            >
              Christian Abendan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
