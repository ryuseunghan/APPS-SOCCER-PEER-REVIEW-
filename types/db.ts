// Design Ref: §3 — DB 타입 정의. 모든 Supabase 테이블 행의 TypeScript 표현.

export type Position = "GK" | "DF" | "MF" | "FW";

export type ReviewStatus = "upcoming" | "pending" | "completed" | "closed";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  jersey_number: number | null;
  position: Position | null;
  password_hash: string;
  created_at: string;
}

export interface DbMatch {
  id: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM:SS'
  place: string;
  our_score: number | null;
  opponent_score: number | null;
  review_deadline: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DbReview {
  id: string;
  match_id: string;
  reviewer_id: string;
  reviewee_id: string;
  skill: number;
  stamina: number;
  teamplay: number;
  comment: string | null;
  created_at: string;
}

export interface DbMvpVote {
  id: string;
  match_id: string;
  voter_id: string;
  voted_for_id: string;
  created_at: string;
}
