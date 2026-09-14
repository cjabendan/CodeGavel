import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  tag?: string;
}

export function FeatureCard({ icon, title, description, tag }: FeatureCardProps) {
  return (
    <div className="bg-white border border-zinc-200 hover:border-zinc-300 p-5 rounded-xl transition-all shadow-sm flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg w-fit">{icon}</div>
          {tag && (
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  );
}
