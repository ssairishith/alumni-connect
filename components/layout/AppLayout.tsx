"use client";

import { useEffect } from "react";
import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

export default function AppLayout({ user, profile }: { user: User; profile: Profile }) {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setMobileSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [setMobileSidebarOpen]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          position: "relative",
          zIndex: 41,
        }}
        className="sidebar-wrapper"
      >
        <Sidebar user={user} profile={profile} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <MainContent user={user} profile={profile} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed !important;
            left: ${isMobileSidebarOpen ? "0" : "-240px"} !important;
            top: 0; bottom: 0;
            transition: left 0.25s ease;
          }
          .mobile-overlay {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
