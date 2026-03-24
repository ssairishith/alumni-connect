"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Post, User, Comment } from "@/lib/types";
import { useAppStore } from "@/lib/store";

interface Props {
  post: Post;
  user: User;
  onMutate: () => void;
  showAdminActions?: boolean;
}

export default function PostCard({ post, user, onMutate, showAdminActions }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reactLoading, setReactLoading] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  const { setActivePanel } = useAppStore();
  const isExpired = post.deadline && new Date(post.deadline) < new Date();
  const isPending = post.status === "pending";

  const toggleComments = async () => {
    if (!expanded) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`, { credentials: "include" });
        const json = await res.json();
        setComments(json.data ?? []);
      } finally {
        setLoadingComments(false);
      }
    }
    setExpanded((e) => !e);
  };

  const handleReact = async (reaction: "like" | "dislike") => {
    if (reactLoading) return;
    setReactLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      const json = await res.json();
      if (json.success) {
        setLocalPost((p) => ({
          ...p,
          like_count: json.data.like_count ?? 0,
          dislike_count: json.data.dislike_count ?? 0,
          user_reaction: json.data.user_reaction ?? null,
        }));
      }
    } finally {
      setReactLoading(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const json = await res.json();
      if (json.success) {
        setComments((c) => [...c, json.data]);
        setNewComment("");
        setLocalPost((p) => ({ ...p, comment_count: p.comment_count + 1 }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminAction = async (action: "approve" | "reject") => {
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (json.success) onMutate();
  };

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: 0,
        overflow: "hidden",
        opacity: isExpired ? 0.7 : 1,
        border: isPending ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)",
      }}
    >
      {isPending && (
        <div
          style={{
            background: "rgba(245,158,11,0.08)",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
            padding: "5px 16px",
            fontSize: 11,
            fontWeight: 600,
            color: "#fcd34d",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          ⏳ Pending Approval
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--primary-dim)",
              border: "1px solid var(--border-active)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
              color: "#fca5a5",
            }}
          >
            {post.author_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                onClick={() => setActivePanel({ type: "profile", userId: post.author_id })}
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {post.author_name ?? "Unknown"}
              </span>
              <span className={`badge badge-${post.author_role}`}>{post.author_role}</span>
              {post.author_company && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  @ {post.author_company}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {post.title}
        </h3>

        {/* Content */}
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            marginBottom: 10,
          }}
        >
          {post.content}
        </p>

        {/* Deadline */}
        {post.deadline && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 6,
              background: isExpired ? "rgba(220,38,38,0.08)" : "rgba(16,185,129,0.08)",
              border: `1px solid ${isExpired ? "rgba(220,38,38,0.2)" : "rgba(16,185,129,0.2)"}`,
              fontSize: 12,
              color: isExpired ? "#f87171" : "#6ee7b7",
              marginBottom: 12,
            }}
          >
            {isExpired ? "⌛" : "⏰"} Deadline: {new Date(post.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {isExpired && " (Expired)"}
          </div>
        )}

        {/* Reactions + comment toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => handleReact("like")}
            disabled={reactLoading}
            style={{
              background: localPost.user_reaction === "like" ? "rgba(59,130,246,0.15)" : "var(--surface-3)",
              border: `1px solid ${localPost.user_reaction === "like" ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
              color: localPost.user_reaction === "like" ? "#93c5fd" : "var(--text-secondary)",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            👍 {localPost.like_count ?? 0}
          </button>

          <button
            onClick={() => handleReact("dislike")}
            disabled={reactLoading}
            style={{
              background: localPost.user_reaction === "dislike" ? "rgba(220,38,38,0.1)" : "var(--surface-3)",
              border: `1px solid ${localPost.user_reaction === "dislike" ? "rgba(220,38,38,0.2)" : "var(--border)"}`,
              color: localPost.user_reaction === "dislike" ? "#f87171" : "var(--text-secondary)",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            👎 {localPost.dislike_count ?? 0}
          </button>

          <button
            onClick={toggleComments}
            style={{
              background: expanded ? "var(--primary-dim)" : "var(--surface-3)",
              border: `1px solid ${expanded ? "var(--border-active)" : "var(--border)"}`,
              color: expanded ? "var(--text-primary)" : "var(--text-secondary)",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            💬 {localPost.comment_count ?? 0} Comments
          </button>

          {/* Admin actions */}
          {(showAdminActions || (user.role === "admin" && isPending)) && (
            <>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px", color: "#6ee7b7", borderColor: "rgba(16,185,129,0.2)" }} onClick={() => handleAdminAction("approve")}>
                ✓ Approve
              </button>
              <button className="btn btn-danger" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => handleAdminAction("reject")}>
                ✗ Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comments section */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface-2)",
            padding: 16,
          }}
        >
          {loadingComments ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              {comments.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "8px 0" }}>
                  No comments yet. Be the first!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: "flex", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--surface-4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.author_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                            {c.author_name}
                          </span>
                          <span className={`badge badge-${c.author_role}`}>{c.author_role}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              <form onSubmit={submitComment} style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newComment.trim()}
                  style={{ padding: "8px 14px" }}
                >
                  {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
