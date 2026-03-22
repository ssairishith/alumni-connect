import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage } from "@/lib/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const lastTimestampRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addMessages = (newMsgs: ChatMessage[]) => {
    const unseen = newMsgs.filter((m) => !seenIdsRef.current.has(m.id));
    if (unseen.length === 0) return;
    unseen.forEach((m) => seenIdsRef.current.add(m.id));
    setMessages((prev) => [...prev, ...unseen]);
    lastTimestampRef.current = unseen[unseen.length - 1].created_at;
  };

  // Load initial messages
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch("/api/chat/messages", { credentials: "include" });
        const json = await res.json();
        const msgs: ChatMessage[] = json.data ?? [];
        msgs.forEach((m) => seenIdsRef.current.add(m.id));
        setMessages(msgs);
        if (msgs.length > 0) {
          lastTimestampRef.current = msgs[msgs.length - 1].created_at;
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    async function pollNew() {
      if (!lastTimestampRef.current) return;
      try {
        const res = await fetch(
          `/api/chat/messages?since=${encodeURIComponent(lastTimestampRef.current)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        const newMsgs: ChatMessage[] = json.data ?? [];
        if (newMsgs.length > 0) addMessages(newMsgs);
      } catch {
        // Silently ignore network errors during polling
      }
    }

    pollingRef.current = setInterval(pollNew, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      // Add via addMessages so seenIdsRef is updated — prevents poll from adding it again
      if (json.success && json.data) {
        addMessages([json.data]);
      }
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  return { messages, isLoading, isSending, sendMessage };
}