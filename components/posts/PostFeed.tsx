"use client";

import { useState } from "react";
import type { User, Profile, ChannelId } from "@/lib/types";
import { CHANNELS } from "@/lib/types";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import { useAppStore } from "@/lib/store";

interface Props {
  channel: ChannelId;
  user: User;
  profile: Profile;
}

export default function PostFeed({ channel, user, profile }: Props) {
  const { posts, isLoading, mutate } = usePosts(channel);
  const { isCreatePostOpen, setCreatePostOpen } = useAppStore();

  const channelInfo = CHANNELS.find((c) => c.id === channel);

  // Who can post in which channels
  const canPost =
    channel === "announcements"
      ? ["admin", "faculty"].includes(user.role)
      : true;

  const pendingCount = posts.filter((p) => p.status === "pending").length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Channel header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
            {channelInfo?.icon} {channelInfo?.label}
          </h2>
          {pendingCount > 0 && user.role === "admin" && (
            <span style={{ fontSize: 12, color: "#fcd34d" }}>
              {pendingCount} pending approval
            </span>
          )}
        </div>
        {canPost && (
          <button
            className="btn btn-primary"
            onClick={() => setCreatePostOpen(true)}
            style={{ gap: 6, fontSize: 13 }}
          >
            <span>＋</span> New Post
          </button>
        )}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 12, width: "70%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: "55%" }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <span className="icon">{channelInfo?.icon}</span>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
              No posts yet in #{channelInfo?.label}
            </p>
            {canPost && (
              <p style={{ fontSize: 13 }}>
                Be the first to post something!
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
            {/* Show pending posts for admins */}
            {user.role === "admin" && posts.filter((p) => p.status === "pending").length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fcd34d",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 0",
                  }}
                >
                  Pending Approval
                </div>
                {posts
                  .filter((p) => p.status === "pending")
                  .map((post) => (
                    <PostCard key={post.id} post={post} user={user} onMutate={mutate} />
                  ))}
                <div className="divider" />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 0",
                  }}
                >
                  Published
                </div>
              </>
            )}
            {posts
              .filter((p) => p.status === "approved" || user.role !== "admin")
              .filter((p) => p.status === "approved")
              .map((post) => (
                <PostCard key={post.id} post={post} user={user} onMutate={mutate} />
              ))}
          </div>
        )}
      </div>

      {isCreatePostOpen && (
        <CreatePostModal
          channel={channel}
          user={user}
          onClose={() => setCreatePostOpen(false)}
          onCreated={() => {
            setCreatePostOpen(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
