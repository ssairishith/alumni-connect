"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { User, Profile } from "@/lib/types";
import { useChat } from "@/hooks/useChat";

export default function ChatPanel({ user, profile }: { user: User; profile: Profile }) {
  const { messages, isLoading, isSending, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as never);
    }
  };

  const myName = profile.full_name ?? user.email;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>💬</span>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
            Live Chat
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Real-time community chat · All users
          </p>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#6ee7b7",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#6ee7b7",
              animation: "pulseSoft 2s infinite",
            }}
          />
          Live
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <span className="icon">💬</span>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No messages yet</p>
            <p style={{ fontSize: 13 }}>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id;
            const prevMsg = messages[i - 1];
            const isSameAuthor = prevMsg && prevMsg.sender_id === msg.sender_id;
            const timeDiff = prevMsg
              ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
              : Infinity;
            const showHeader = !isSameAuthor || timeDiff > 5 * 60 * 1000;

            return (
              <div
                key={msg.id}
                className="animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  marginTop: showHeader ? 12 : 2,
                }}
              >
                {showHeader && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                      flexDirection: isMe ? "row-reverse" : "row",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: isMe ? "var(--primary-dim)" : "var(--surface-4)",
                        border: `1px solid ${isMe ? "var(--border-active)" : "var(--border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: isMe ? "#fca5a5" : "var(--text-secondary)",
                      }}
                    >
                      {msg.sender_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                      {isMe ? "You" : msg.sender_name}
                    </span>
                    <span className={`badge badge-${msg.sender_role}`}>{msg.sender_role}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "8px 12px",
                    borderRadius: isMe
                      ? "12px 12px 3px 12px"
                      : "12px 12px 12px 3px",
                    background: isMe ? "var(--primary)" : "var(--surface-3)",
                    border: `1px solid ${isMe ? "transparent" : "var(--border)"}`,
                    color: "var(--text-primary)",
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface-1)",
          flexShrink: 0,
        }}
      >
        <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder={`Message as ${myName}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSending || !input.trim()}
            style={{ padding: "8px 16px", flexShrink: 0 }}
          >
            {isSending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Send"}
          </button>
        </form>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
