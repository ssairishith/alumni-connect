// hooks/usePosts.ts
import useSWR from "swr";
import type { Post } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((j) => j.data ?? []);

export function usePosts(channel: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Post[]>(
    channel ? `/api/posts?channel=${channel}` : null,
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  );

  return {
    posts: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

// Admin: all posts
export function useAllPosts() {
  const { data, error, isLoading, mutate } = useSWR<Post[]>(
    "/api/posts",
    fetcher,
    { revalidateOnFocus: true }
  );
  return { posts: data ?? [], isLoading, error, mutate };
}
