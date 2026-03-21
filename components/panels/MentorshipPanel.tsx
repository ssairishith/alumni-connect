"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import type { User, MentorshipRequest } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json()).then((j) => j.data ?? []);

export default function MentorshipPanel({ user }: { user: User }) {
  const { data: requests = [], mutate } = useSWR<MentorshipRequest[]>(
    "/api/mentorship",
    fetcher,
    { refreshInterval: 30000 }
  );

  const handleAction = async (id: string, status: "accepted" | "rejected") => {
    const res = await fetch(`/api/mentorship/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) mutate();
  };

  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
          🤝 Mentorship
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
          {user.role === "alumni"
            ? "Manage incoming mentorship requests from students"
            : "Track your mentorship requests to alumni"}
        </p>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="icon">🤝</span>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
              {user.role === "alumni" ? "No requests yet" : "No requests sent yet"}
            </p>
            <p style={{ fontSize: 13 }}>
              {user.role === "student"
                ? "Browse the Alumni Directory to find a mentor"
                : "Students will be able to send you mentorship requests"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
            {pending.length > 0 && (
              <>
                <SectionLabel>Pending ({pending.length})</SectionLabel>
                {pending.map((r) => (
                  <RequestCard key={r.id} request={r} user={user} onAction={handleAction} />
                ))}
              </>
            )}

            {others.length > 0 && (
              <>
                {pending.length > 0 && <div className="divider" />}
                <SectionLabel>History</SectionLabel>
                {others.map((r) => (
                  <RequestCard key={r.id} request={r} user={user} onAction={handleAction} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 0" }}>
      {children}
    </div>
  );
}

function RequestCard({
  request,
  user,
  onAction,
}: {
  request: MentorshipRequest;
  user: User;
  onAction: (id: string, status: "accepted" | "rejected") => void;
}) {
  const isAlumni = user.role === "alumni";

  const statusStyle = {
    pending: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", color: "#fcd34d", label: "Pending" },
    accepted: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", color: "#6ee7b7", label: "Accepted" },
    rejected: { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", color: "#f87171", label: "Rejected" },
  }[request.status];

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: 16,
        borderColor: request.status === "pending" ? "rgba(245,158,11,0.25)" : "var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {isAlumni ? request.student_name : request.alumni_name}
          </div>
          {!isAlumni && request.alumni_company && (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              @ {request.alumni_company}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            background: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
            color: statusStyle.color,
            flexShrink: 0,
          }}
        >
          {statusStyle.label}
        </span>
      </div>

      {request.message && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            padding: "8px 12px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            borderLeft: "2px solid var(--border-active)",
            marginBottom: 10,
          }}
        >
          &ldquo;{request.message}&rdquo;
        </p>
      )}

      {isAlumni && request.status === "pending" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, color: "#6ee7b7", borderColor: "rgba(16,185,129,0.3)", fontSize: 13 }}
            onClick={() => onAction(request.id, "accepted")}
          >
            ✓ Accept
          </button>
          <button
            className="btn btn-danger"
            style={{ flex: 1, fontSize: 13 }}
            onClick={() => onAction(request.id, "rejected")}
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  );
}
