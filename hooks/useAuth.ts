// hooks/useAuth.ts
// FIX: Auth state lives in SWR + httpOnly cookie.
// No localStorage, no Zustand for auth. Session dies when browser closes.

import useSWR from "swr";
import type { User, Profile } from "@/lib/types";

interface AuthData {
  user: User;
  profile: Profile;
}

const fetcher = async (url: string): Promise<AuthData | null> => {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch session");
  const json = await res.json();
  return json.data ?? null;
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<AuthData | null>(
    "/api/auth/me",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoggedIn: !!data?.user,
    isLoading,
    error,
    mutate,
    // Convenience: combined object
    authUser: data ?? null,
  };
}
