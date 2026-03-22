"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/auth/AuthPage";
import ProfileSetup from "@/components/auth/ProfileSetup";
import AppLayout from "@/components/layout/AppLayout";

export default function Home() {
  const { user, profile, isLoading, mutate } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32 }} />
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", letterSpacing: "0.1em", fontSize: 12 }}>
            LOADING
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → Auth
  if (!user) {
    return <AuthPage onAuth={mutate} />;
  }

  // Faculty pending approval → locked screen
  if (user.role === "faculty" && user.status === "pending") {
    return <PendingVerificationScreen email={user.email} onLogout={mutate} />;
  }

  // Profile not set up → setup wizard (skip for admin)
  if (user.role !== "admin" && user.role !== "faculty" && profile && !profile.is_setup_complete) {
    return <ProfileSetup onComplete={mutate} onBack={async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    mutate();
    }} />;
  }

  // Fully authenticated → main app
  return <AppLayout user={user} profile={profile ?? {
  id: user.id,
  full_name: user.email.split("@")[0],
  bio: null,
  current_company: null,
  job_role: null,
  graduation_year: null,
  skills: [],
  avatar_url: null,
  is_setup_complete: true,
}} />;
}

function PendingVerificationScreen({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    onLogout();
  };

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="card text-center"
        style={{ maxWidth: 480, padding: 48, margin: "0 20px" }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--text-primary)",
          }}
        >
          Verification Pending
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
          Your faculty account ({email}) is awaiting admin verification.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 28 }}>
          You&apos;ll receive a notification once approved. Please check back later.
        </p>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
