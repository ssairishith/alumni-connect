// lib/store.ts
// FIX: Zustand only manages UI state (active panel, mobile sidebar).
// ALL server data lives in SWR hooks — never in this store.
// This was a root cause of the "posts not appearing" bug.

import { create } from "zustand";
import type { ChannelId } from "./types";

export type ActivePanel =
  | { type: "welcome" }
  | { type: "channel"; channel: ChannelId }
  | { type: "alumni-directory" }
  | { type: "mentorship" }
  | { type: "notifications" }
  | { type: "admin" }
  | { type: "chat" };

interface AppStore {
  // Navigation
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;

  // Mobile sidebar
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  // Create post modal
  isCreatePostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;

  // Optimistic unread count (refreshed from server by useNotifications)
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activePanel: { type: "welcome" },
  setActivePanel: (panel) => set({ activePanel: panel }),

  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),

  isCreatePostOpen: false,
  setCreatePostOpen: (open) => set({ isCreatePostOpen: open }),

  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
}));
