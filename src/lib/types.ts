export interface Member {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  image_url?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  email: string;
  is_approved: boolean;
  points: number;
  created_at: string;
}

export interface PointTransaction {
  id: string;
  member_id: string;
  points: number;
  reason: string;
  source: "vote" | "click" | "project" | "admin" | "joined";
  project_id?: string;
  awarded_by?: string;
  created_at: string;
}

export interface Project {
  id: string;
  member_id: string;
  title: string;
  description?: string;
  url: string;
  clicks: number;
  monthly_votes?: number;
  created_at: string;
}
