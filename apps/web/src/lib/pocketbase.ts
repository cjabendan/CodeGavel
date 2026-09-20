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

export const pb = new PocketBase(getPocketBaseUrl());
