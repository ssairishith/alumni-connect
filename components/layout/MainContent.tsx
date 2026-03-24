"use client";

import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import PostFeed from "@/components/posts/PostFeed";
import ChatPanel from "@/components/panels/ChatPanel";
import AlumniDirectory from "@/components/panels/AlumniDirectory";
import MentorshipPanel from "@/components/panels/MentorshipPanel";
import NotificationsPanel from "@/components/panels/NotificationsPanel";
import AdminPanel from "@/components/panels/AdminPanel";
import WelcomePanel from "@/components/panels/WelcomePanel";
import ProfilePanel from "@/components/profile/ProfilePanel";
import DirectChatPanel from "@/components/chat/DirectChatPanel";

export default function MainContent({ user, profile }: { user: User; profile: Profile }) {
  const { activePanel, toggleMobileSidebar } = useAppStore();

  const getPanelLabel = () => {
    switch (activePanel.type) {
      case "welcome": return "🏠 Welcome";
      case "channel": return `# ${activePanel.channel}`;
      case "chat": return "💬 Live Chat";
      case "alumni-directory": return "🎓 Alumni Directory";
      case "mentorship": return "🤝 Mentorship";
      case "notifications": return "🔔 Notifications";
      case "admin": return "⚙️ Admin Panel";
      case "profile": return "🧑 Profile";
      case "direct-chat": return `💬 Chat with ${activePanel.peerName}`;
      default: return "AU Connect";
    }
  };

  const renderPanel = () => {
    switch (activePanel.type) {
      case "welcome":
        return <WelcomePanel user={user} profile={profile} />;
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
        return user.role === "admin" ? <AdminPanel /> : (
          <div className="empty-state">
            <span className="icon">🚫</span>
            <p style={{ fontWeight: 600 }}>Access Denied</p>
          </div>
        );
      case "profile":
        return <ProfilePanel user={user} profile={profile} targetUserId={activePanel.userId} />;
      case "direct-chat":
        return (
          <DirectChatPanel
            user={user}
            profile={profile}
            conversationId={activePanel.conversationId}
            peerId={activePanel.peerId}
            peerName={activePanel.peerName}
          />
        );
      default:
        return <WelcomePanel user={user} profile={profile} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Mobile sticky header */}
      <div className="mobile-header">
        <button
          onClick={toggleMobileSidebar}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
            fontSize: 22,
            padding: "2px 6px",
            lineHeight: 1,
          }}
        >
          ☰
        </button>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 15,
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {getPanelLabel()}
        </span>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderPanel()}
      </div>
    </div>
  );
}