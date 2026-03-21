"use client";

import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import PostFeed from "@/components/posts/PostFeed";
import ChatPanel from "@/components/panels/ChatPanel";
import AlumniDirectory from "@/components/panels/AlumniDirectory";
import MentorshipPanel from "@/components/panels/MentorshipPanel";
import NotificationsPanel from "@/components/panels/NotificationsPanel";
import AdminPanel from "@/components/panels/AdminPanel";

export default function MainContent({ user, profile }: { user: User; profile: Profile }) {
  const { activePanel, toggleMobileSidebar } = useAppStore();

  const renderPanel = () => {
    switch (activePanel.type) {
      case "channel":
        return <PostFeed channel={activePanel.channel} user={user} profile={profile} />;
      case "chat":
        return <ChatPanel user={user} profile={profile} />;
      case "alumni-directory":
        return <AlumniDirectory user={user} />;
      case "mentorship":
        return <MentorshipPanel user={user} />;
      case "notifications":
        return <NotificationsPanel />;
      case "admin":
        return user.role === "admin" ? <AdminPanel /> : <Forbidden />;
      default:
        return null;
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Mobile header */}
      <div
        style={{
          display: "none",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          alignItems: "center",
          gap: 12,
        }}
        className="mobile-header"
      >
        <button
          onClick={toggleMobileSidebar}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontSize: 20 }}
        >
          ☰
        </button>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
          Alumni Chatspace
        </span>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderPanel()}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="empty-state">
      <span className="icon">🚫</span>
      <p style={{ fontWeight: 600 }}>Access Denied</p>
      <p style={{ fontSize: 13 }}>You don't have permission to view this panel.</p>
    </div>
  );
}
