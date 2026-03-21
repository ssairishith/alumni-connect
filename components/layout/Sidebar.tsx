"use client";

import type { User, Profile } from "@/lib/types";
import { CHANNELS } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNotifications } from "@/hooks/useNotifications";

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

export default function Sidebar({ user, profile }: { user: User; profile: Profile }) {
  const { activePanel, setActivePanel } = useAppStore();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const isChannelActive = (ch: string) =>
    activePanel.type === "channel" && activePanel.channel === ch;

  const isPanelActive = (type: string) => activePanel.type === type;

  const navItems = [
    ...(user.role === "alumni" || user.role === "student"
      ? [{ id: "alumni-directory", label: "Alumni Directory", icon: "🎓" }]
      : []),
    { id: "mentorship", label: "Mentorship", icon: "🤝" },
    { id: "chat", label: "Live Chat", icon: "💬" },
    { id: "notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
    ...(user.role === "admin"
      ? [{ id: "admin", label: "Admin Panel", icon: "⚙️" }]
      : []),
  ] as { id: string; label: string; icon: string; badge?: number }[];

  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: "1px solid var(--border)",
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
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Alumni Chatspace
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Community Platform
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflow: "auto", padding: "10px 8px" }}>
        {/* Channels */}
        <SectionHeader>Channels</SectionHeader>
        {CHANNELS.map((ch) => {
          // Check channel permissions
          if (ch.id === "announcements" && !["admin", "faculty"].includes(user.role)) {
            // Students/alumni can VIEW announcements
          }
          return (
            <button
              key={ch.id}
              className={`channel-item ${isChannelActive(ch.id) ? "active" : ""}`}
              style={{ width: "100%", textAlign: "left", border: "none" }}
              onClick={() => setActivePanel({ type: "channel", channel: ch.id })}
            >
              <span style={{ fontSize: 15 }}>{ch.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}># {ch.label}</span>
            </button>
          );
        })}

        <div className="divider" />

        {/* Feature panels */}
        <SectionHeader>Features</SectionHeader>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`channel-item ${isPanelActive(item.id) ? "active" : ""}`}
            style={{ width: "100%", textAlign: "left", border: "none" }}
            onClick={() => setActivePanel({ type: item.id as never })}
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
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
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
          }}
        >
          {profile.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profile.full_name ?? user.email}
          </div>
          <RoleBadge role={user.role} />
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 16,
            padding: 4,
            borderRadius: 6,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#f87171")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
        >
          ⬡
        </button>
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
        color: "var(--text-muted)",
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
