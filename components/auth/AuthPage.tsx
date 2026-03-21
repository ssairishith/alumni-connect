"use client";

import { useState } from "react";

type Mode = "login" | "signup" | "signup-faculty";

export default function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup" || mode === "signup-faculty";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignup && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          isFaculty: mode === "signup-faculty",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Something went wrong");
        return;
      }
      onAuth();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(133,7,7,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              background: "var(--primary)",
              borderRadius: 14,
              fontSize: 24,
              marginBottom: 14,
              boxShadow: "0 0 32px var(--primary-glow)",
            }}
          >
            🎓
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Alumni Chatspace
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Connect · Learn · Grow
          </p>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
            padding: 4,
            marginBottom: 20,
            border: "1px solid var(--border)",
          }}
        >
          {(
            [
              { id: "login", label: "Sign In" },
              { id: "signup", label: "Student" },
              { id: "signup-faculty", label: "Faculty" },
            ] as { id: Mode; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); setError(""); }}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: mode === tab.id ? "var(--surface-4)" : "transparent",
                color: mode === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: mode === tab.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 28 }}>
          {mode === "signup-faculty" && (
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "#fcd34d",
              }}
            >
              ⚠️ Faculty accounts require admin verification before access is granted.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email Address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder={isSignup ? "Min. 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>

            {isSignup && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Confirm Password
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "rgba(220,38,38,0.1)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#f87171",
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, padding: "10px 0", fontSize: 15, fontWeight: 600 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  {isSignup ? "Creating account…" : "Signing in…"}
                </span>
              ) : isSignup ? (
                mode === "signup-faculty" ? "Register as Faculty" : "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {isSignup && (
          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
            After signup, you&apos;ll complete your profile setup.
          </p>
        )}
      </div>
    </div>
  );
}
