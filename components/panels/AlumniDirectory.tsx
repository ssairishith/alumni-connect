"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAppStore } from "@/lib/store";
import type { User, AlumniProfile, MentorshipStatus } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json()).then((j) => j.data ?? []);

export default function AlumniDirectory({ user }: { user: User }) {
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [selected, setSelected] = useState<AlumniProfile | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestDone, setRequestDone] = useState<string | null>(null);

  const query = filterCompany
    ? `?company=${encodeURIComponent(filterCompany)}`
    : filterSkill
    ? `?skill=${encodeURIComponent(filterSkill)}`
    : "";

  const { data: alumni = [], mutate } = useSWR<AlumniProfile[]>(
    `/api/alumni${query}`,
    fetcher
  );

  const displayed = alumni.filter((a) =>
    !search ||
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.current_company?.toLowerCase().includes(search.toLowerCase())
  );

  const sendRequest = async () => {
    if (!selected || requesting) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumni_id: selected.id, message: requestMsg }),
      });
      const json = await res.json();
      if (json.success) {
        setRequestDone("sent");
        mutate();
      } else {
        setRequestDone(json.error ?? "Error");
      }
    } finally {
      setRequesting(false);
    }
  };

  const getStatusColor = (status?: MentorshipStatus | null) => {
    if (status === "accepted") return { bg: "rgba(16,185,129,0.1)", color: "#6ee7b7", text: "Connected" };
    if (status === "pending") return { bg: "rgba(245,158,11,0.1)", color: "#fcd34d", text: "Request Sent" };
    if (status === "rejected") return { bg: "rgba(220,38,38,0.1)", color: "#f87171", text: "Rejected" };
    return null;
  };

  const { setActivePanel } = useAppStore();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
          🎓 Alumni Directory
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Search by name or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1 1 200px" }}
          />
          <input
            className="input"
            placeholder="Filter by company"
            value={filterCompany}
            onChange={(e) => { setFilterCompany(e.target.value); setFilterSkill(""); }}
            style={{ flex: "1 1 160px" }}
          />
          <input
            className="input"
            placeholder="Filter by skill"
            value={filterSkill}
            onChange={(e) => { setFilterSkill(e.target.value); setFilterCompany(""); }}
            style={{ flex: "1 1 160px" }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {displayed.length === 0 ? (
          <div className="empty-state">
            <span className="icon">🎓</span>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No alumni found</p>
            <p style={{ fontSize: 13 }}>Try clearing the filters</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {displayed.map((a) => {
              const status = getStatusColor(a.request_status);
              return (
                <div
                  key={a.id}
                  className="card animate-fade-in"
                  style={{ padding: 18, cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" }}
                  onClick={() => { setSelected(a); setRequestDone(null); setRequestMsg(""); }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.transform = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--primary-dim)",
                        border: "1px solid var(--border-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#fca5a5",
                        flexShrink: 0,
                      }}
                    >
                      {a.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.full_name}
                      </div>
                      {a.graduation_year && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Class of {a.graduation_year}</div>
                      )}
                    </div>
                  </div>

                  {(a.current_company || a.job_role) && (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                      {a.job_role}
                      {a.job_role && a.current_company && " @ "}
                      {a.current_company && <strong style={{ color: "var(--text-primary)" }}>{a.current_company}</strong>}
                    </p>
                  )}

                  {a.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {a.skills.slice(0, 3).map((s) => (
                        <span key={s} className="skill-tag">{s}</span>
                      ))}
                      {a.skills.length > 3 && (
                        <span className="skill-tag">+{a.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {status ? (
                    <span
                      style={{
                        display: "inline-flex",
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: status.bg,
                        color: status.color,
                      }}
                    >
                      {status.text}
                    </span>
                  ) : user.role === "student" ? (
                    <span style={{ fontSize: 12, color: "var(--primary-light)" }}>
                      Click to request mentorship →
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700 }}>
                {selected.full_name}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelected(null);
                    setActivePanel({ type: "profile", userId: selected.id });
                  }}
                  style={{ fontSize: 12 }}
                >
                  View Profile
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setSelected(null);
                    const res = await fetch("/api/direct-conversations", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ other_user_id: selected.id }),
                    });
                    const json = await res.json();
                    if (json.success && json.data?.conversationId) {
                      setActivePanel({
                        type: "direct-chat",
                        conversationId: json.data.conversationId,
                        peerId: selected.id,
                        peerName: selected.full_name || selected.id,
                      });
                    }
                  }}
                  style={{ fontSize: 12 }}
                >
                  Open Chat
                </button>
              </div>
              {/* Info */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {selected.current_company && (
                  <InfoChip icon="🏢" label={selected.current_company} />
                )}
                {selected.job_role && (
                  <InfoChip icon="💼" label={selected.job_role} />
                )}
                {selected.graduation_year && (
                  <InfoChip icon="🎓" label={`Class of ${selected.graduation_year}`} />
                )}
              </div>

              {selected.bio && (
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                  {selected.bio}
                </p>
              )}

              {selected.skills.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selected.skills.map((s) => (
                      <span key={s} className="skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Request section */}
              {user.role === "student" && !selected.request_status && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Request Mentorship
                  </div>
                  {requestDone === "sent" ? (
                    <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "#6ee7b7" }}>
                      ✓ Request sent! {selected.full_name} will be notified.
                    </div>
                  ) : requestDone ? (
                    <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
                      {requestDone}
                    </div>
                  ) : (
                    <>
                      <textarea
                        className="input"
                        placeholder="Introduce yourself and explain what kind of guidance you're looking for…"
                        rows={3}
                        value={requestMsg}
                        onChange={(e) => setRequestMsg(e.target.value)}
                        style={{ marginBottom: 10, resize: "vertical" }}
                      />
                      <button className="btn btn-primary" onClick={sendRequest} disabled={requesting} style={{ width: "100%" }}>
                        {requesting ? <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><span className="spinner" style={{ width: 14, height: 14 }} />Sending…</span> : "Send Mentorship Request"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {selected.request_status && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <span style={{ ...getStatusColor(selected.request_status), padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {getStatusColor(selected.request_status)?.text ?? selected.request_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, color: "var(--text-secondary)" }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function getStatusColor(status?: MentorshipStatus | null) {
  if (status === "accepted") return { bg: "rgba(16,185,129,0.1)", color: "#6ee7b7", text: "Connected ✓" };
  if (status === "pending") return { bg: "rgba(245,158,11,0.1)", color: "#fcd34d", text: "Request Sent" };
  if (status === "rejected") return { bg: "rgba(220,38,38,0.1)", color: "#f87171", text: "Rejected" };
  return null;
}
