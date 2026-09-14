import Link from "next/link";

export function Footer() {
  return (
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
  );
}
