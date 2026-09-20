import { ShieldCheck, Terminal } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-zinc-900 p-1.5 rounded-md text-white">
          <Terminal className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-zinc-900">CodeGavel</span>
          <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded">
            v1.0-LAN
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local Engine Active</span>
        </div>
      </div>
    </header>
  );
}
