import PocketBase from "pocketbase";

const getPocketBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL;
  }
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8090`;
  }
  return "http://127.0.0.1:8090";
};

// Lazy singleton — only created in the browser so that LocalAuthStore can
// read from localStorage at construction time. In production builds, Next.js
// evaluates modules on the server (SSR/prerender) where localStorage doesn't
// exist, which causes pb.authStore.isValid to be false even for valid sessions.
let _pb: PocketBase | null = null;

export const getPb = (): PocketBase => {
  if (!_pb) {
    _pb = new PocketBase(getPocketBaseUrl());
  }
  return _pb;
};

// Convenience re-export for code that runs only in the browser.
// Do NOT call this at module-evaluation time in server components or
// outside of useEffect / event handlers.
export const pb = typeof window !== "undefined" ? getPb() : (null as unknown as PocketBase);
