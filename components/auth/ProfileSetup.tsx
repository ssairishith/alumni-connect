"use client";

import { useState, useRef } from "react";
import type { ParsedResume } from "@/lib/types";

export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"upload" | "form">("upload");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState("");
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    full_name: string;
    bio: string;
    graduation_year: string;
    current_company: string;
    job_role: string;
    skills: string;
  }>({
    full_name: "",
    bio: "",
    graduation_year: "",
    current_company: "",
    job_role: "",
    skills: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const applyParsed = (parsed: ParsedResume) => {
    setForm({
      full_name: parsed.full_name ?? "",
      bio: parsed.bio ?? "",
      graduation_year: parsed.graduation_year ? String(parsed.graduation_year) : "",
      current_company: parsed.current_company ?? "",
      job_role: parsed.job_role ?? "",
      skills: (parsed.skills ?? []).join(", "),
    });
    setStep("form");
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setParsing(true);
    setParseError("");
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await res.json();
      if (!json.success) {
        setParseError(json.error ?? "Could not parse resume");
        setStep("form");
        return;
      }
      applyParsed(json.data);
    } catch {
      setParseError("Network error parsing resume");
      setStep("form");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") handleFileUpload(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    if (!form.full_name.trim()) { setSaveError("Full name is required"); return; }
    if (!form.graduation_year || isNaN(Number(form.graduation_year))) {
      setSaveError("Graduation year is required"); return;
    }
    setSaving(true);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/profile/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, graduation_year: Number(form.graduation_year), skills }),
      });
      const json = await res.json();
      if (!json.success) { setSaveError(json.error ?? "Could not save profile"); return; }
      onComplete();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflow: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Set Up Your Profile
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            Upload your resume to auto-fill, or enter your details manually.
          </p>
        </div>

        {step === "upload" && !parsing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Drop zone */}
            <div
              className="card"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "48px 32px",
                textAlign: "center",
                cursor: "pointer",
                borderStyle: "dashed",
                borderColor: "var(--border-hover)",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)";
                (e.currentTarget as HTMLDivElement).style.background = "var(--primary-dim)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface-1)";
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>
                Drop your resume here
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>PDF files only · AI will auto-fill your profile</p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
            </div>

            {parseError && (
              <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, color: "#f87171" }}>
                {parseError} — fill out manually below.
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>OR</span>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
            </div>

            <button className="btn btn-ghost" style={{ width: "100%", padding: "10px 0" }} onClick={() => setStep("form")}>
              Fill out manually
            </button>
          </div>
        )}

        {parsing && (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Parsing your resume with AI…</p>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>Extracting your details via Llama 3.3</p>
          </div>
        )}

        {step === "form" && !parsing && (
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Your Details</h2>
              {form.full_name && (
                <span style={{ fontSize: 12, color: "var(--primary-light)", background: "var(--primary-dim)", padding: "3px 10px", borderRadius: 99 }}>
                  ✨ AI-filled
                </span>
              )}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full Name *" hint="Your display name on the platform">
                <input className="input" placeholder="e.g. Rahul Sharma" value={form.full_name} onChange={set("full_name")} required />
              </Field>

              <Field label="Graduation Year *" hint="Used to determine Student vs Alumni role">
                <input className="input" type="number" placeholder="e.g. 2025" min={2000} max={2035} value={form.graduation_year} onChange={set("graduation_year")} required />
              </Field>

              <Field label="Current Company" hint="Your employer (for alumni)">
                <input className="input" placeholder="e.g. Google, Infosys" value={form.current_company} onChange={set("current_company")} />
              </Field>

              <Field label="Job Role" hint="Your current designation">
                <input className="input" placeholder="e.g. Software Engineer" value={form.job_role} onChange={set("job_role")} />
              </Field>

              <Field label="Skills" hint="Comma-separated list">
                <input className="input" placeholder="React, Node.js, Python, Machine Learning" value={form.skills} onChange={set("skills")} />
              </Field>

              <Field label="Bio" hint="A short professional summary">
                <textarea
                  className="input"
                  placeholder="Tell us about yourself…"
                  rows={3}
                  value={form.bio}
                  onChange={set("bio")}
                  style={{ resize: "vertical" }}
                />
              </Field>

              <div style={{ padding: "10px 14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "#93c5fd" }}>
                ℹ️ Your role (Student or Alumni) is automatically determined by your graduation year. Year &lt; current year = Alumni.
              </div>

              {saveError && (
                <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, color: "#f87171" }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep("upload")} style={{ flex: 1 }}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>
                  {saving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="spinner" style={{ width: 14, height: 14 }} />
                      Saving…
                    </span>
                  ) : "Save & Enter →"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}
