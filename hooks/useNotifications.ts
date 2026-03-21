// hooks/useNotifications.ts
import useSWR from "swr";
import type { Notification } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((j) => j.data ?? []);

export function useNotifications() {
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);

  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  useEffect(() => {
    if (data) {
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [data, setUnreadCount]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    mutate();
  };

  return {
    notifications: data ?? [],
    unreadCount: data ? data.filter((n) => !n.is_read).length : 0,
    isLoading,
    error,
    mutate,
    markRead,
  };
}
