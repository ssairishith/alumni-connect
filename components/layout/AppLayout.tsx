"use client";

import { useEffect } from "react";
import type { User, Profile } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

export default function AppLayout({ user, profile }: { user: User; profile: Profile }) {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth > 768) setMobileSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [setMobileSidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileSidebarOpen]);

  return (
    <div className="app-layout">
      {/* Overlay behind sidebar on mobile */}
      <div
        className={`sidebar-overlay ${isMobileSidebarOpen ? "open" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <Sidebar user={user} profile={profile} onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="main-content">
        <MainContent user={user} profile={profile} />
      </div>
    </div>
  );
}