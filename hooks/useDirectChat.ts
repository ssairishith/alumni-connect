import { useState, useEffect, useRef, useCallback } from "react";
import type { DirectMessage } from "@/lib/types";

export function useDirectChat(conversationId?: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const lastTimestampRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addMessages = (newMsgs: DirectMessage[]) => {
    const unseen = newMsgs.filter((m) => !seenIdsRef.current.has(m.id));
    if (unseen.length === 0) return;
    unseen.forEach((m) => seenIdsRef.current.add(m.id));
    setMessages((prev) => [...prev, ...unseen]);
    lastTimestampRef.current = unseen[unseen.length - 1].created_at;
  };

  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);
    seenIdsRef.current.clear();
    lastTimestampRef.current = null;

    async function load() {
      try {
        const res = await fetch(`/api/direct-conversations/${conversationId}/messages`, {
          credentials: "include",
        });
        const json = await res.json();
        const msgs: DirectMessage[] = json.data ?? [];
        msgs.forEach((m) => seenIdsRef.current.add(m.id));
        setMessages(msgs);
        if (msgs.length > 0) lastTimestampRef.current = msgs[msgs.length - 1].created_at;
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    async function poll() {
      try {
        const res = await fetch(`/api/direct-conversations/${conversationId}/messages`, {
          credentials: "include",
        });
        const json = await res.json();
        const msgs: DirectMessage[] = json.data ?? [];
        addMessages(msgs);
      } catch {
        // ignore
      }
    }

    pollingRef.current = setInterval(poll, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || isSending) return;
      setIsSending(true);
      try {
        const res = await fetch(`/api/direct-conversations/${conversationId}/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const message = json.data as DirectMessage;
          addMessages([message]);
        }
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending]
  );

  return { messages, isLoading, isSending, sendMessage };
}
