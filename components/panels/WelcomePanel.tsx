"use client";

import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";

const ROLE_CONTENT = {
  student: {
    emoji: "🎓",
    headline: "Your journey starts here.",
    tagline: "AU Connect is your bridge between college and career.",
    description:
      "This platform connects you with alumni who've walked the same halls, sat in the same classes, and now work across top companies around the world. Use it to discover internships, find mentors, stay updated on hackathons, and grow your professional network — all within your university community.",
    protocols: [
      {
        icon: "🤝",
        title: "Be respectful",
        body: "Alumni are here voluntarily to help you. Approach every interaction with professionalism and gratitude.",
      },
      {
        icon: "📝",
        title: "Keep posts relevant",
        body: "Each channel has a purpose. Post internship queries in Internships, hackathon info in Hackathons, and important updates in Announcements.",
      },
      {
        icon: "🔒",
        title: "No spam or self-promotion",
        body: "Posts that are off-topic, repetitive, or purely self-promotional will be reviewed and may be removed.",
      },
      {
        icon: "💬",
        title: "Ask good questions",
        body: "When reaching out for mentorship, be specific. Tell the alumni who you are, what you're working on, and exactly what guidance you're looking for.",
      },
    ],
    cta: {
      label: "Browse Alumni Directory →",
      panel: "alumni-directory" as const,
    },
  },
  alumni: {
    emoji: "⭐",
    headline: "Welcome back. You're the reason this works.",
    tagline: "Your experience is someone else's roadmap.",
    description:
      "Thank you for being part of AU Connect. Every post you share, every mentorship request you accept, and every piece of advice you leave behind creates a ripple that helps students navigate their path with more confidence. You've been where they are — and that matters more than you know.",
    protocols: [
      {
        icon: "🌟",
        title: "Share real experiences",
        body: "Students benefit most from honest, specific stories — the wins, the pivots, the lessons. Authenticity beats polish every time.",
      },
      {
        icon: "📬",
        title: "Respond to mentorship requests",
        body: "Even a brief reply goes a long way. If you're not available, a kind decline is far better than silence.",
      },
      {
        icon: "✅",
        title: "Post quality opportunities",
        body: "All your posts go through admin review before publishing. Make sure listings are accurate, current, and include all necessary details.",
      },
      {
        icon: "🏫",
        title: "Represent Anurag University well",
        body: "You are an ambassador of this community. Engage with the same integrity you'd bring to a professional environment.",
      },
    ],
    cta: {
      label: "Post an Opportunity →",
      panel: "channel" as const,
      channel: "internships" as const,
    },
  },
  faculty: {
    emoji: "📚",
    headline: "Shaping the next generation.",
    tagline: "Your oversight keeps this community strong.",
    description:
      "AU Connect works because of the trust and structure that faculty members bring to it. Your role is to ensure that every interaction on this platform upholds the values and reputation of Anurag University — and to connect students with the opportunities they deserve.",
    protocols: [
      {
        icon: "📢",
        title: "Use Announcements wisely",
        body: "The Announcements channel is reserved for official and important updates. Keep posts clear, factual, and relevant to the student body.",
      },
      {
        icon: "👁️",
        title: "Monitor discussions",
        body: "Keep an eye on channel activity. If you see inappropriate content, report it through the platform so it can be reviewed promptly.",
      },
      {
        icon: "🎯",
        title: "Endorse strong students",
        body: "Your recommendation carries weight. When a student is ready, guiding them toward the right alumni or opportunity can change their trajectory.",
      },
    ],
    cta: {
      label: "Go to Announcements →",
      panel: "channel" as const,
      channel: "announcements" as const,
    },
  },
  admin: {
    emoji: "⚙️",
    headline: "You keep the lights on.",
    tagline: "Every healthy community needs a guardian.",
    description:
      "As an admin, you have full visibility across the platform. Your role is to ensure AU Connect remains a safe, disciplined, and valuable space for every student, alumni, and faculty member. Stay proactive — the health of this community depends on timely decisions and consistent oversight.",
    protocols: [
      {
        icon: "📋",
        title: "Review pending posts",
        body: "Alumni posts require your approval before going live. Check the Admin Panel regularly to keep the feed current and relevant.",
      },
      {
        icon: "👩‍🏫",
        title: "Verify faculty accounts",
        body: "Faculty members cannot access the platform until you approve their registration. Review new faculty requests promptly.",
      },
      {
        icon: "🔍",
        title: "Monitor the audit log",
        body: "The audit log records every significant action on the platform. Review it periodically to spot patterns or issues early.",
      },
      {
        icon: "⚡",
        title: "Act swiftly on violations",
        body: "If a post, comment, or user behaviour violates platform norms, take action immediately. A fast, fair response keeps trust intact.",
      },
    ],
    cta: {
      label: "Open Admin Panel →",
      panel: "admin" as const,
    },
  },
};

export default function WelcomePanel({
  user,
  profile,
}: {
  user: User;
  profile: Profile;
}) {
  const { setActivePanel } = useAppStore();
  const role = user?.role ?? "student";
  const content = ROLE_CONTENT[role as keyof typeof ROLE_CONTENT] ?? ROLE_CONTENT.student;
  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const handleCta = () => {
    if (content.cta.panel === "channel" && "channel" in content.cta) {
      setActivePanel({ type: "channel", channel: content.cta.channel! });
    } else {
      setActivePanel({ type: content.cta.panel as never });
    }
  };
  if (!user) return null; 
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a1628 0%, #161020 50%, #6b0a0e 100%)",
          padding: "48px 32px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(192,24,30,0.12)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>{content.emoji}</div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 4,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "var(--font-display)",
            }}
          >
            Welcome back
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: 8,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {firstName}, {content.headline}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.65)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            {content.tagline}
          </p>
          <button
            className="btn"
            onClick={handleCta}
            style={{
              background: "#c0181e",
              color: "#fff",
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: "0 0 20px rgba(192,24,30,0.4)",
            }}
          >
            {content.cta.label}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "32px", maxWidth: 760, margin: "0 auto" }}>
        {/* About section */}
        <div
          className="card"
          style={{ padding: "20px 24px", marginBottom: 24 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 10,
              color: "var(--text-primary)",
            }}
          >
            About AU Connect
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.75,
            }}
          >
            {content.description}
          </p>
        </div>

        {/* Protocols */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 14,
            color: "var(--text-primary)",
          }}
        >
          {user.role === "admin" || user.role === "faculty"
            ? "Your Responsibilities"
            : "Community Guidelines"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {content.protocols.map((p, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: "16px 18px", display: "flex", gap: 14 }}
            >
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                {p.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 4,
                    color: "var(--text-primary)",
                  }}
                >
                  {p.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {p.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 14,
            color: "var(--text-primary)",
          }}
        >
          Quick Links
        </h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "📢 Announcements", type: "channel", channel: "announcements" },
            { label: "💼 Internships", type: "channel", channel: "internships" },
            { label: "⚡ Hackathons", type: "channel", channel: "hackathons" },
            { label: "🤝 Mentorship", type: "mentorship" },
            ...(user.role === "student" || user.role === "alumni"
              ? [{ label: "🎓 Alumni Directory", type: "alumni-directory" }]
              : []),
            ...(user.role === "admin"
              ? [{ label: "⚙️ Admin Panel", type: "admin" }]
              : []),
          ].map((link, i) => (
            <button
              key={i}
              className="btn btn-ghost"
              style={{ fontSize: 13 }}
              onClick={() => {
                if (link.type === "channel") {
                  setActivePanel({
                    type: "channel",
                    channel: link.channel as never,
                  });
                } else {
                  setActivePanel({ type: link.type as never });
                }
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 40,
            padding: "14px 18px",
            borderRadius: 8,
            background: "var(--primary-dim)",
            border: "1px solid var(--border-active)",
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          🏫 <strong style={{ color: "var(--text-primary)" }}>Anurag University</strong> — Venkatapur, Ghatkesar, Medchal–Malkajgiri district, Hyderabad, Telangana. This platform is exclusively for verified students, alumni, and faculty of Anurag University.
        </div>
      </div>
    </div>
  );
}