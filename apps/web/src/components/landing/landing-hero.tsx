import { Code2, Shield, UserCheck } from "lucide-react";
import { FeatureCard } from "@/components/landing/landing-card";
import { JoinExamForm } from "@/components/landing/landing-joinForm";

export function Hero() {
  return (
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
  );
}
