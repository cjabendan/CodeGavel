"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/authService";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (authService.isLoggedIn()) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in all required credentials.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.loginAdmin(trimmedEmail, password);
      router.push("/admin/dashboard");
    } catch (err) {
      console.error("[Admin Login Error]:", err);
      setError("Invalid email address or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm max-w-md w-full">
      <div className="mb-6 text-center">
        <div className="mx-auto w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center mb-3 shadow-sm">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
          Instructor Portal
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Authenticate with your instructor account to access exam sessions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              id="email"
              type="email"
              placeholder="instructor@codegavel.local"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all disabled:opacity-50"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-10 py-2.5 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all disabled:opacity-50"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}