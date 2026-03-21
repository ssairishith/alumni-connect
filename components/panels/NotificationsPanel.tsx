"use client";

import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";

const ICONS: Record<string, string> = {
  comment: "💬",
  like: "👍",
  mentorship_request: "🤝",
  mentorship_response: "📩",
  post_approved: "✅",
  post_rejected: "❌",
  pending_post: "⏳",
  account_approved: "🎉",
  default: "🔔",
};

export default function NotificationsPanel() {
  const { notifications, isLoading, markRead } = useNotifications();

  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
            🔔 Notifications
          </h2>
          {unread.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--primary-light)", marginTop: 2 }}>
              {unread.length} unread
            </p>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 58, borderRadius: "var(--radius)" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span className="icon">🔔</span>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>All caught up!</p>
            <p style={{ fontSize: 13 }}>No notifications yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, maxWidth: 600 }}>
            {unread.length > 0 && (
              <>
                <SectionLabel>Unread</SectionLabel>
                {unread.map((n) => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} />
                ))}
              </>
            )}
            {read.length > 0 && (
              <>
                {unread.length > 0 && <div className="divider" />}
                <SectionLabel>Earlier</SectionLabel>
                {read.map((n) => (
                  <NotifItem key={n.id} notif={n} onRead={markRead} />
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
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 4px 4px" }}>
      {children}
    </div>
  );
}

function NotifItem({
  notif,
  onRead,
}: {
  notif: { id: string; type: string; content: string; is_read: boolean; created_at: string };
  onRead: (id: string) => void;
}) {
  const icon = ICONS[notif.type] ?? ICONS.default;
  return (
    <div
      onClick={() => !notif.is_read && onRead(notif.id)}
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius)",
        background: notif.is_read ? "transparent" : "rgba(133,7,7,0.06)",
        border: `1px solid ${notif.is_read ? "transparent" : "rgba(133,7,7,0.15)"}`,
        cursor: notif.is_read ? "default" : "pointer",
        transition: "background 0.15s",
        marginBottom: 4,
      }}
      onMouseEnter={(e) => {
        if (!notif.is_read) (e.currentTarget as HTMLDivElement).style.background = "rgba(133,7,7,0.1)";
      }}
      onMouseLeave={(e) => {
        if (!notif.is_read) (e.currentTarget as HTMLDivElement).style.background = "rgba(133,7,7,0.06)";
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: notif.is_read ? "var(--text-secondary)" : "var(--text-primary)", lineHeight: 1.5 }}>
          {notif.content}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>
      {!notif.is_read && (
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--primary-light)",
            flexShrink: 0,
            marginTop: 6,
          }}
        />
      )}
    </div>
  );
}
