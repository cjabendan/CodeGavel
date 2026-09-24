"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPb } from "@/lib/pocketbase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isLoginPage = pathname === "/admin" || pathname === "/admin/";

  useEffect(() => {
    setMounted(true);

    // getPb() guarantees the PocketBase instance is created in the browser,
    // ensuring LocalAuthStore has read the token from localStorage before we
    // check isValid. Using the module-level `pb` export can be the server-side
    // null placeholder in production builds and would always appear invalid.
    const pb = getPb();

    const isValid = pb.authStore.isValid;
    const isSystemAdmin =
      pb.authStore.isSuperuser ||
      pb.authStore.record?.collectionName === "_superusers" ||
      pb.authStore.record?.role === "admin";

    if (isLoginPage && isValid && isSystemAdmin) {
      router.replace("/admin/dashboard");
      return;
    }

    if (!isLoginPage && (!isValid || !isSystemAdmin)) {
      router.replace("/admin");
      return;
    }

    setIsAuthorized(true);
  }, [router, isLoginPage]);

  if (!mounted) {
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-400 font-mono text-xs">
        Verifying administrator authorization...
      </div>
    );
  }

  return <>{children}</>;
}
