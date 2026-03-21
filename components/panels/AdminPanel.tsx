"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import type { Post, AuditLog } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json()).then((j) => j.data ?? []);

type Tab = "posts" | "faculty" | "logs";

interface FacultyRow {
  id: string;
  email: string;
  status: string;
  full_name: string | null;
  created_at: string;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("posts");

  const { data: posts = [], mutate: mutatePosts } = useSWR<Post[]>(
    tab === "posts" ? "/api/posts" : null,
    fetcher
  );
  const { data: faculty = [], mutate: mutateFaculty } = useSWR<FacultyRow[]>(
    tab === "faculty" ? "/api/admin/faculty/list" : null,
    fetcher
  );
  const { data: logs = [] } = useSWR<AuditLog[]>(
    tab === "logs" ? "/api/admin/logs" : null,
    fetcher
  );

  const pendingPosts = posts.filter((p) => p.status === "pending");
  const pendingFaculty = faculty.filter((f) => f.status === "pending");

  const handlePostAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    mutatePosts();
  };

  const handleFacultyAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/faculty/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    mutateFaculty();
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: "posts", label: "Posts", icon: "📝", badge: pendingPosts.length },
    { id: "faculty", label: "Faculty", icon: "👩‍🏫", badge: pendingFaculty.length },
    { id: "logs", label: "Audit Logs", icon: "📋" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          ⚙️ Admin Panel
        </h2>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: tab === t.id ? "var(--primary-dim)" : "transparent",
                color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.12s",
                borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              }}
            >
              {t.icon} {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 99,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {/* POSTS TAB */}
        {tab === "posts" && (
          <div style={{ maxWidth: 720 }}>
            {pendingPosts.length === 0 ? (
              <div className="empty-state">
                <span className="icon">✅</span>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No pending posts</p>
                <p style={{ fontSize: 13 }}>All posts have been reviewed</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Pending Approval ({pendingPosts.length})
                </div>
                {pendingPosts.map((p) => (
                  <div key={p.id} className="card" style={{ padding: 16, borderColor: "rgba(245,158,11,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 12, color: "#fcd34d", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                          {p.channel} · by {p.author_name}
                          <span className={`badge badge-${p.author_role}`} style={{ marginLeft: 6 }}>{p.author_role}</span>
                        </p>
                        <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.title}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {p.content.length > 200 ? p.content.slice(0, 200) + "…" : p.content}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ flex: 1, color: "#6ee7b7", borderColor: "rgba(16,185,129,0.3)", fontSize: 13 }}
                        onClick={() => handlePostAction(p.id, "approve")}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1, fontSize: 13 }}
                        onClick={() => handlePostAction(p.id, "reject")}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FACULTY TAB */}
        {tab === "faculty" && (
          <div style={{ maxWidth: 680 }}>
            {faculty.length === 0 ? (
              <div className="empty-state">
                <span className="icon">👩‍🏫</span>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No faculty accounts</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingFaculty.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fcd34d", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                    Pending Verification ({pendingFaculty.length})
                  </div>
                )}
                {faculty.map((f) => (
                  <div key={f.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fcd34d",
                        flexShrink: 0,
                      }}
                    >
                      {(f.full_name ?? f.email)[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.full_name ?? "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.email}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Joined {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <span
                      className={`badge ${f.status === "active" ? "badge-approved" : "badge-pending"}`}
                    >
                      {f.status}
                    </span>
                    {f.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ color: "#6ee7b7", borderColor: "rgba(16,185,129,0.3)", fontSize: 12, padding: "4px 10px" }}
                          onClick={() => handleFacultyAction(f.id, "approve")}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={() => handleFacultyAction(f.id, "reject")}
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {tab === "logs" && (
          <div style={{ maxWidth: 780 }}>
            {logs.length === 0 ? (
              <div className="empty-state">
                <span className="icon">📋</span>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No audit logs yet</p>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1.5fr auto",
                    padding: "8px 14px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  <span>Admin</span>
                  <span>Action</span>
                  <span>Details</span>
                  <span>Time</span>
                </div>
                {logs.map((log, i) => (
                  <div
                    key={log.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1.5fr auto",
                      padding: "10px 14px",
                      fontSize: 13,
                      borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{log.admin_name ?? "System"}</span>
                    <span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: log.action.includes("approve") || log.action.includes("created")
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(220,38,38,0.1)",
                          color: log.action.includes("approve") || log.action.includes("created")
                            ? "#6ee7b7"
                            : "#f87171",
                        }}
                      >
                        {log.action}
                      </span>
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.details ?? log.target_type ?? "—"}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11, whiteSpace: "nowrap" }}>
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
