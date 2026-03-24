"use client";

import type { User, Profile } from "@/lib/types";
import { CHANNELS } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/hooks/useNotifications";

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

export default function Sidebar({
  user,
  profile,
  onClose,
}: {
  user: User;
  profile: Profile;
  onClose?: () => void;
}) {
  const { activePanel, setActivePanel } = useAppStore();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const navigate = (panel: Parameters<typeof setActivePanel>[0]) => {
    setActivePanel(panel);
    onClose?.();
  };

  const isChannelActive = (ch: string) =>
    activePanel.type === "channel" && activePanel.channel === ch;

  const isPanelActive = (type: string) => activePanel.type === type;

  const navItems = [
    { id: "welcome", label: "Welcome", icon: "🏠" },
    ...(user.role === "alumni" || user.role === "student"
      ? [{ id: "alumni-directory", label: "Alumni Directory", icon: "🎓" }]
      : []),
    { id: "mentorship", label: "Mentorship", icon: "🤝" },
    { id: "chat", label: "Live Chat", icon: "💬" },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
      badge: unreadCount,
    },
    ...(user.role === "admin"
      ? [{ id: "admin", label: "Admin Panel", icon: "⚙️" }]
      : []),
  ] as { id: string; label: string; icon: string; badge?: number }[];

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        background:
          "linear-gradient(170deg, #0a1628 0%, #161020 40%, #6b0a0e 100%)",
        borderRight: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: "var(--primary)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
              boxShadow: "0 0 16px var(--primary-glow)",
            }}
          >
            🎓
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 14,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              AU Connect
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Anurag University
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 9px",
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 8px" }}>
        <SectionHeader>Channels</SectionHeader>
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            className={`channel-item ${isChannelActive(ch.id) ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", border: "none" }}
            onClick={() =>
              navigate({ type: "channel", channel: ch.id })
            }
          >
            <span style={{ fontSize: 15 }}>{ch.icon}</span>
            <span style={{ flex: 1, fontSize: 13 }}># {ch.label}</span>
          </button>
        ))}

        <div className="divider" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <SectionHeader>Features</SectionHeader>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`channel-item ${isPanelActive(item.id) ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", border: "none" }}
            onClick={() => navigate({ type: item.id as never })}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 99,
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User footer */}
      <div
        style={{
          minHeight: 140,
          padding: "14px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "rgba(0,0,0,0.2)",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              fontSize: 15,
              flexShrink: 0,
              color: "#fca5a5",
              fontWeight: 700,
            }}
          >
            {profile.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {profile.full_name ?? user.email}
            </div>
            <RoleBadge role={user.role} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate({ type: "profile" })}
            style={{
              flex: 1,
              minHeight: 34,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              transition: "all 0.15s",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              minHeight: 34,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              transition: "all 0.15s",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "6px 8px 4px",
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}