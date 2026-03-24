"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json()).then((j) => j.data ?? null);

interface Props {
  user: User;
  profile: Profile;
  targetUserId?: string;
}

export default function ProfilePanel({ user, profile, targetUserId }: Props) {
  const [editState, setEditState] = useState({
    full_name: profile.full_name ?? "",
    bio: profile.bio ?? "",
    current_company: profile.current_company ?? "",
    job_role: profile.job_role ?? "",
    graduation_year: profile.graduation_year ?? "",
    skills: (profile.skills || []).join(", "),
    avatar_url: profile.avatar_url ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { setActivePanel } = useAppStore();

  const viewId = targetUserId || user.id;

  const { data, mutate } = useSWR<{ user: any; isSelf: boolean }>(
    `/api/profile?user_id=${encodeURIComponent(viewId)}`,
    fetcher
  );

  const isSelf = data?.isSelf ?? viewId === user.id;
  const profileUser = data?.user;

  useEffect(() => {
    if (profileUser) {
      setEditState({
        full_name: profileUser.full_name ?? "",
        bio: profileUser.bio ?? "",
        current_company: profileUser.current_company ?? "",
        job_role: profileUser.job_role ?? "",
        graduation_year: profileUser.graduation_year ?? "",
        skills: (profileUser.skills || []).join(", "),
        avatar_url: profileUser.avatar_url ?? "",
      });
    }
  }, [profileUser]);

  const save = async () => {
    if (!isSelf) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        full_name: editState.full_name,
        bio: editState.bio,
        current_company: editState.current_company,
        job_role: editState.job_role,
        graduation_year: editState.graduation_year ? Number(editState.graduation_year) : null,
        skills: editState.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        avatar_url: editState.avatar_url,
      };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      setMessage("Profile saved.");
      mutate();
    } catch (err) {
      console.error(err);
      setMessage("Unable to save profile, try again.");
    } finally {
      setSaving(false);
    }
  };

  const startDirectChat = async () => {
    if (!profileUser || profileUser.id === user.id) return;
    const res = await fetch("/api/direct-conversations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ other_user_id: profileUser.id }),
    });
    const json = await res.json();
    if (json.success && json.data?.conversationId) {
      setActivePanel({
        type: "direct-chat",
        conversationId: json.data.conversationId,
        peerId: profileUser.id,
        peerName: profileUser.full_name || profileUser.email,
      });
    }
  };

  if (!profileUser) {
    return (
      <div className="empty-state">
        <span className="icon">🌀</span>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
          {isSelf ? "🧑 Your Profile" : "🔍 View Profile"}
        </h2>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 20, maxWidth: 760 }}>
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--primary-dim)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>
              {profileUser.full_name?.[0]?.toUpperCase() ?? profileUser.email[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{profileUser.full_name || profileUser.email}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{profileUser.role}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Full Name</label>
            <input
              value={editState.full_name}
              onChange={(e) => setEditState((s) => ({ ...s, full_name: e.target.value }))}
              className="input"
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Bio</label>
            <textarea
              value={editState.bio}
              onChange={(e) => setEditState((s) => ({ ...s, bio: e.target.value }))}
              className="input"
              style={{ minHeight: 86 }}
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Current Company</label>
            <input
              value={editState.current_company}
              onChange={(e) => setEditState((s) => ({ ...s, current_company: e.target.value }))}
              className="input"
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Job Role</label>
            <input
              value={editState.job_role}
              onChange={(e) => setEditState((s) => ({ ...s, job_role: e.target.value }))}
              className="input"
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Graduation Year</label>
            <input
              value={editState.graduation_year}
              onChange={(e) => setEditState((s) => ({ ...s, graduation_year: e.target.value }))}
              className="input"
              type="number"
              min={1900}
              max={new Date().getFullYear() + 5}
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Skills (comma-separated)</label>
            <input
              value={editState.skills}
              onChange={(e) => setEditState((s) => ({ ...s, skills: e.target.value }))}
              className="input"
              disabled={!isSelf}
            />

            <label style={{ fontSize: 12, fontWeight: 700 }}>Avatar URL</label>
            <input
              value={editState.avatar_url}
              onChange={(e) => setEditState((s) => ({ ...s, avatar_url: e.target.value }))}
              className="input"
              disabled={!isSelf}
            />

            {message && (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{message}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {isSelf ? (
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save Profile"}
                </button>
              ) : null}

              {!isSelf ? (
                <button className="btn btn-primary" onClick={startDirectChat}>
                  🔗 Start Direct Chat
                </button>
              ) : null}

              <button className="btn btn-ghost" onClick={() => setActivePanel({ type: "welcome" })}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
