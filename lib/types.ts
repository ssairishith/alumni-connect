// lib/types.ts

export type UserRole = "student" | "alumni" | "faculty" | "admin";
export type UserStatus = "active" | "pending";
export type PostStatus = "approved" | "pending";
export type MentorshipStatus = "pending" | "accepted" | "rejected";
export type ReactionType = "like" | "dislike";

export const CHANNELS = [
  { id: "announcements", label: "Announcements", icon: "📢" },
  { id: "internships", label: "Internships", icon: "💼" },
  { id: "hackathons", label: "Hackathons", icon: "⚡" },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  current_company: string | null;
  job_role: string | null;
  graduation_year: number | null;
  skills: string[];
  avatar_url: string | null;
  is_setup_complete: boolean;
}

export interface AuthUser extends User {
  profile: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  author_company: string | null;
  channel: ChannelId;
  title: string;
  content: string;
  deadline: string | null;
  status: PostStatus;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  user_reaction: ReactionType | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  created_at: string;
}

export interface MentorshipRequest {
  id: string;
  student_id: string;
  student_name: string;
  alumni_id: string;
  alumni_name: string;
  alumni_company: string | null;
  message: string | null;
  status: MentorshipStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export interface AlumniProfile {
  id: string;
  full_name: string;
  current_company: string | null;
  job_role: string | null;
  graduation_year: number | null;
  skills: string[];
  bio: string | null;
  has_pending_request?: boolean;
  request_status?: MentorshipStatus | null;
}

export interface ParsedResume {
  full_name: string | null;
  bio: string | null;
  graduation_year: number | null;
  current_company: string | null;
  job_role: string | null;
  skills: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
