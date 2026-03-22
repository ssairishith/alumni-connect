"use client";

import { useState } from "react";
import type { User, ChannelId } from "@/lib/types";
import { CHANNELS } from "@/lib/types";

interface Props {
  channel: ChannelId;
  user: User;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ channel, user, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>(channel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAlumni = user.role === "alumni" || user.role === "student";

  // Which channels can this user post in?
  const postableChannels = CHANNELS.filter((c) => {
    if (c.id === "announcements") return ["admin", "faculty"].includes(user.role);
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: selectedChannel,
          title: title.trim(),
          content: content.trim(),
          deadline: deadline || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create post");
        return;
      }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700 }}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Alumni notice */}
          {isAlumni && (
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: 13,
                color: "#fcd34d",
              }}
            >
              ℹ️ Your post will be reviewed by an admin before publishing.
            </div>
          )}

          {/* Channel select */}
          <div>
            <label style={labelStyle}>Channel</label>
            <select
              className="input"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as ChannelId)}
              style={{ cursor: "pointer" }}
            >
              {postableChannels.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "var(--surface-2)" }}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              className="input"
              placeholder="e.g. Amazon Summer Internship 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={500}
            />
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              className="input"
              placeholder="Share details, links, requirements…"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Deadline */}
          <div>
            <label style={labelStyle}>
              Deadline{" "}
              <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", fontSize: 11 }}>
                (post auto-deletes after this date)
              </span>
            </label>
            <input
              className="input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                fontSize: 13,
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 2 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Publishing…
                </span>
              ) : isAlumni ? "Submit for Approval" : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
