# Design: Supabase 전체 DB 스키마 연동

> **Feature Key**: `supabase-full-schema`
> **Date**: 2026-04-05
> **Phase**: Design
> **Architecture**: Option C — Pragmatic Balance

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현재 모든 UI가 mock 데이터 — 실제 경기·리뷰·레이팅 데이터 없이는 앱 가치 전달 불가 |
| **WHO** | Happy Life FC 팀원 전체 (경기 등록자 + 리뷰 참여자) |
| **RISK** | 리뷰 마감 시간 로직, 자기 자신 리뷰 제외 처리, MVP 중복 투표 방지 |
| **SUCCESS** | 경기 등록 → 참가자 리스트 → 리뷰 제출 → 랭킹 반영 전체 흐름 실데이터로 동작 |
| **SCOPE** | DB 마이그레이션 + lib/queries + API 라우트 + 기존 페이지 연동. 실시간/알림 미포함 |

---

## 1. Overview

### 1.1 Architecture Decision: Option C — Pragmatic Balance

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Components                            │
│   MatchRegisterForm  ReviewFlow                                 │
│        │ fetch()          │ fetch()                             │
└────────┼──────────────────┼─────────────────────────────────────┘
         ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (app/api/)                        │
│   POST /api/matches   GET /api/users   POST /api/reviews        │
│   GET  /api/matches/[id]/participants                           │
│        │                                                         │
└────────┼─────────────────────────────────────────────────────────┘
         │                  ▲
         ▼                  │ import directly
┌─────────────────────────────────────────────────────────────────┐
│                    lib/queries/ (query helpers)                 │
│   matches.ts   reviews.ts   rankings.ts   profile.ts   users.ts │
│        │                                                         │
└────────┼─────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server Components                            │
│   matches/page  rankings/page  profile/page  home/page         │
│   import { getMatches } from '@/lib/queries/matches'            │
│   → DB 직접 쿼리 (HTTP 없음)                                     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
    Supabase (PostgreSQL)
```

**선택 이유**: Server Component는 `lib/queries/`를 직접 import해 HTTP 오버헤드 없이 DB 쿼리. Client Component(MatchRegisterForm, ReviewFlow)는 fetch → API 라우트 경유. 코드 중복 없이 각 시나리오에 최적.

---

## 2. DB 스키마

### 2.1 Migration SQL

```sql
-- Migration: supabase-full-schema
-- 2026-04-05

-- 1. users 테이블에 position 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
-- 값: 'GK' | 'DF' | 'MF' | 'FW' | NULL

-- 2. matches 테이블
CREATE TABLE IF NOT EXISTS matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  place            TEXT NOT NULL,
  our_score        INT,
  opponent_score   INT,
  review_deadline  TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- 3. match_participants 테이블
CREATE TABLE IF NOT EXISTS match_participants (
  match_id  UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  PRIMARY KEY (match_id, user_id)
);

ALTER TABLE match_participants DISABLE ROW LEVEL SECURITY;

-- 4. reviews 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  reviewee_id  UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  skill        INT  NOT NULL CHECK (skill    BETWEEN 1 AND 5),
  stamina      INT  NOT NULL CHECK (stamina  BETWEEN 1 AND 5),
  teamplay     INT  NOT NULL CHECK (teamplay BETWEEN 1 AND 5),
  comment      TEXT CHECK (char_length(comment) <= 50),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, reviewer_id, reviewee_id)
);

ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 5. mvp_votes 테이블
CREATE TABLE IF NOT EXISTS mvp_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  voter_id      UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  voted_for_id  UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, voter_id),
  CHECK (voter_id != voted_for_id)
);

ALTER TABLE mvp_votes DISABLE ROW LEVEL SECURITY;
```

---

## 3. Type Definitions

**파일**: `types/db.ts`

```typescript
export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export type ReviewStatus = 'upcoming' | 'pending' | 'completed' | 'closed';

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
  date: string;           // 'YYYY-MM-DD'
  time: string;           // 'HH:MM'
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
```

---

## 4. lib/queries/ 설계

### 4.1 matches.ts

```typescript
// lib/queries/matches.ts
// Design Ref: §4.1 — Server Component용 직접 DB 쿼리 헬퍼

export interface MatchWithStatus extends DbMatch {
  participant_count: number;
  review_status: ReviewStatus;
  has_my_review?: boolean;     // userId 전달 시 계산
}

// GET /api/matches, matches/page.tsx에서 사용
export async function getMatches(userId?: string): Promise<MatchWithStatus[]>

// GET /api/matches/[id]
export async function getMatchById(id: string): Promise<DbMatch | null>

// POST /api/matches — 경기 + 참가자 동시 insert (트랜잭션)
export async function createMatch(data: {
  date: string;
  time: string;
  place: string;
  our_score?: number | null;
  opponent_score?: number | null;
  participant_ids: string[];
  created_by: string;
}): Promise<DbMatch>

// GET /api/matches/[id]/participants
export async function getMatchParticipants(matchId: string): Promise<DbUser[]>
```

**review_status 도출 로직:**
```typescript
function deriveReviewStatus(
  match: DbMatch,
  participantCount: number,
  myReviewCount: number,   // 내가 이 경기에 제출한 리뷰 수
  totalReviewees: number,  // 나를 제외한 참가자 수
  userId?: string
): ReviewStatus {
  const matchDt = new Date(`${match.date}T${match.time}`);
  const now = new Date();
  const deadline = match.review_deadline ? new Date(match.review_deadline) : null;

  if (matchDt > now) return 'upcoming';
  if (deadline && deadline < now) return 'closed';
  if (!userId) return 'pending';
  if (myReviewCount >= totalReviewees) return 'completed';
  return 'pending';
}
```

### 4.2 reviews.ts

```typescript
// lib/queries/reviews.ts

export interface ReviewSubmitData {
  match_id: string;
  reviewer_id: string;
  reviews: Array<{
    reviewee_id: string;
    skill: number;
    stamina: number;
    teamplay: number;
    comment?: string;
  }>;
  mvp_vote?: string;  // voted_for_id
}

// POST /api/reviews
export async function submitReviews(data: ReviewSubmitData): Promise<void>

// 특정 경기에 내가 이미 리뷰를 제출했는지 확인
export async function getMyReviewCount(
  matchId: string,
  reviewerId: string
): Promise<number>
```

### 4.3 rankings.ts

```typescript
// lib/queries/rankings.ts

export interface PlayerRanking {
  id: string;
  name: string;
  position: Position | null;
  jersey_number: number | null;
  overall: number;
  skill: number;
  stamina: number;
  teamplay: number;
  games_played: number;
  mvp_count: number;
}

// GET /api/rankings, rankings/page.tsx에서 사용
// 경기 1회 이상 참가한 유저만 포함
export async function getRankings(): Promise<PlayerRanking[]>
```

**쿼리 전략**: Supabase의 집계 쿼리 활용
```sql
SELECT
  u.id, u.name, u.position, u.jersey_number,
  ROUND(AVG((r.skill + r.stamina + r.teamplay) / 3.0)::numeric, 1) AS overall,
  ROUND(AVG(r.skill)::numeric, 1)    AS skill,
  ROUND(AVG(r.stamina)::numeric, 1)  AS stamina,
  ROUND(AVG(r.teamplay)::numeric, 1) AS teamplay,
  COUNT(DISTINCT mp.match_id) AS games_played,
  COUNT(DISTINCT mv.id)       AS mvp_count
FROM users u
JOIN match_participants mp ON mp.user_id = u.id
LEFT JOIN reviews r  ON r.reviewee_id = u.id
LEFT JOIN mvp_votes mv ON mv.voted_for_id = u.id
GROUP BY u.id, u.name, u.position, u.jersey_number
HAVING COUNT(DISTINCT mp.match_id) >= 1
ORDER BY overall DESC NULLS LAST
```

### 4.4 profile.ts

```typescript
// lib/queries/profile.ts

export interface GrowthDataPoint {
  label: string;   // 경기 날짜 'M/D'
  value: number;   // 해당 경기 overall 평균
}

export interface MyProfile extends PlayerRanking {
  mom_count: number;      // 현재는 mvp_count와 동일 (추후 분리 가능)
  growth_data: GrowthDataPoint[];  // 최근 6경기
}

// GET /api/profile, profile/page.tsx에서 사용
export async function getProfile(userId: string): Promise<MyProfile | null>
```

### 4.5 users.ts

```typescript
// lib/queries/users.ts

export interface ClubMember {
  id: string;
  name: string;
  position: Position | null;
  jersey_number: number | null;
}

// GET /api/users — 전체 멤버 목록 (경기 등록 시 사용)
export async function getUsers(): Promise<ClubMember[]>
```

---

## 5. API Routes 설계

### 5.1 파일 구조

```
app/api/
  matches/
    route.ts              GET (목록), POST (등록)
    [id]/
      route.ts            GET (상세)
      participants/
        route.ts          GET (참가자 목록)
  reviews/
    route.ts              POST (리뷰 + MVP 일괄 제출)
  users/
    route.ts              GET (전체 멤버)
```

### 5.2 GET /api/matches

```typescript
// app/api/matches/route.ts
import { auth } from "@/auth";
import { getMatches } from "@/lib/queries/matches";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matches = await getMatches(session.user.id);
  return NextResponse.json(matches);
}
```

### 5.3 POST /api/matches

**Request body:**
```json
{
  "date": "2026-04-06",
  "time": "10:00",
  "place": "풋살파크 강남 B코트",
  "our_score": null,
  "opponent_score": null,
  "participant_ids": ["uuid1", "uuid2"]
}
```

**Validation:**
- `date`, `time`, `place` 필수
- `participant_ids` 최소 1개
- `our_score`, `opponent_score`: null 허용 (예정 경기)

### 5.4 POST /api/reviews

**Request body:**
```json
{
  "match_id": "uuid",
  "reviews": [
    { "reviewee_id": "uuid", "skill": 4, "stamina": 3, "teamplay": 5, "comment": "최고!" }
  ],
  "mvp_vote": "uuid"
}
```

**Validation:**
- `match_id` 필수
- `reviews` 배열 최소 1개
- `skill`, `stamina`, `teamplay` 1-5 범위
- `mvp_vote`의 voted_for_id ≠ reviewer_id
- reviewer_id = session.user.id (서버에서 강제)

### 5.5 GET /api/rankings (제거 — Server Component 직접 쿼리)

rankings/page.tsx는 Server Component이므로 `lib/queries/rankings.ts`를 직접 import. `/api/rankings` 라우트 불필요.

---

## 6. 프론트엔드 수정 설계

### 6.1 matches/page.tsx (Server Component)

```typescript
// app/(main)/matches/page.tsx
import { auth } from "@/auth";
import { getMatches } from "@/lib/queries/matches";

export default async function MatchesPage() {
  const session = await auth();
  const matches = await getMatches(session?.user?.id);
  // mock 배열 제거 → matches 변수 사용
}
```

**변경 포인트**: 상단 `const matches = [...]` 제거, `auth()` + `getMatches()` 호출로 교체.

### 6.2 MatchRegisterForm.tsx (Client Component)

```typescript
// 추가: useEffect로 멤버 목록 로드
const [members, setMembers] = useState<ClubMember[]>([]);
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setMembers);
}, []);

// 제거: CLUB_MEMBERS 하드코딩 배열
// submit 시: fetch('/api/matches', { method: 'POST', body: JSON.stringify({...}) })
```

### 6.3 ReviewFlow.tsx (Client Component)

```typescript
// 추가: matchId prop에서 참가자 로드
const [players, setPlayers] = useState<ClubMember[]>([]);
useEffect(() => {
  fetch(`/api/matches/${matchId}/participants`)
    .then(r => r.json()).then(setPlayers);
}, [matchId]);

// 제거: PLAYERS 하드코딩 배열
// MVP 제출 시: fetch('/api/reviews', { method: 'POST', body: JSON.stringify({...}) })
```

### 6.4 rankings/page.tsx (Server Component)

```typescript
import { getRankings } from "@/lib/queries/rankings";

export default async function RankingsPage() {
  const rankings = await getRankings();
  // mock rankings 배열 제거
}
```

**주의**: 현재 rankings/page.tsx에서 `MY_ID = "3"` 하드코딩 사용. session에서 userId로 교체 필요 → `auth()` 호출 추가.

### 6.5 profile/page.tsx (Server Component)

```typescript
import { auth } from "@/auth";
import { getProfile } from "@/lib/queries/profile";

export default async function ProfilePage() {
  const session = await auth();
  const profile = await getProfile(session!.user!.id);
  // myProfile, growthData mock 제거
}
```

### 6.6 home/page.tsx (Server Component)

```typescript
import { auth } from "@/auth";
import { getMatches } from "@/lib/queries/matches";
import { getProfile } from "@/lib/queries/profile";

export default async function HomePage() {
  const session = await auth();
  const [matches, profile] = await Promise.all([
    getMatches(session?.user?.id),
    getProfile(session!.user!.id),
  ]);

  const pendingReview = matches.find(m =>
    m.review_status === 'pending' && m.review_deadline
  );
  const recentMatches = matches.filter(m => m.review_status !== 'upcoming').slice(0, 3);
  // myStats, pendingReview, recentMatches mock 제거
}
```

---

## 7. 에러 처리

| 케이스 | HTTP | 응답 |
|--------|------|------|
| 미인증 요청 | 401 | `{ error: "Unauthorized" }` |
| 필수 필드 누락 | 400 | `{ error: "..." }` |
| 경기 없음 | 404 | `{ error: "Match not found" }` |
| 중복 리뷰 제출 | 409 | `{ error: "이미 리뷰를 제출했습니다." }` |
| DB 오류 | 500 | `{ error: "서버 오류가 발생했습니다." }` |

---

## 8. 테스트 시나리오

| 시나리오 | 확인 항목 |
|----------|----------|
| 경기 등록 | POST /api/matches → matches + match_participants DB 저장 확인 |
| 경기 목록 | matches/page에서 실DB 데이터 표시 (mock 아님) |
| 리뷰 제출 | 자기 자신 리뷰 제외, MVP 중복 투표 방지 |
| 랭킹 | 리뷰 1개 이상 제출된 유저만 랭킹에 표시 |
| 프로필 | 성장 그래프가 실제 경기별 평점으로 출력 |
| 홈 대시보드 | pending 경기에 대해서만 "리뷰 대기" 카드 표시 |

---

## 9. 파일 목록

### 9.1 신규 생성

| 파일 | 설명 |
|------|------|
| `types/db.ts` | DB 타입 정의 |
| `lib/queries/matches.ts` | match 관련 쿼리 헬퍼 |
| `lib/queries/reviews.ts` | review/mvp 쿼리 헬퍼 |
| `lib/queries/rankings.ts` | 랭킹 집계 쿼리 |
| `lib/queries/profile.ts` | 프로필 + 성장 그래프 쿼리 |
| `lib/queries/users.ts` | 멤버 목록 쿼리 |
| `app/api/matches/route.ts` | GET 목록, POST 등록 |
| `app/api/matches/[id]/route.ts` | GET 상세 |
| `app/api/matches/[id]/participants/route.ts` | GET 참가자 목록 |
| `app/api/reviews/route.ts` | POST 리뷰 + MVP |
| `app/api/users/route.ts` | GET 멤버 목록 |

### 9.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/(main)/matches/page.tsx` | mock 배열 → getMatches() |
| `app/(main)/matches/new/MatchRegisterForm.tsx` | CLUB_MEMBERS → fetch /api/users, submit → POST /api/matches |
| `app/(main)/review/[matchId]/ReviewFlow.tsx` | PLAYERS → fetch participants, submit → POST /api/reviews |
| `app/(main)/rankings/page.tsx` | mock 배열 → getRankings() + auth() |
| `app/(main)/profile/page.tsx` | mock 데이터 → getProfile() |
| `app/(main)/home/page.tsx` | mock 데이터 → getMatches() + getProfile() |
| `types/next-auth.d.ts` | (있는 경우) User 타입에 position 추가 |

---

## 10. 의존성

추가 패키지 없음. 기존 `@supabase/supabase-js`, `next-auth` 그대로 사용.

---

## 11. Implementation Guide

### 11.1 구현 순서 (중요)

```
[Module 1] DB 마이그레이션
  → Supabase MCP로 SQL 실행

[Module 2] types/db.ts + lib/queries/
  → 타입 정의 먼저, 쿼리 헬퍼 순서대로
  → matches.ts → users.ts → reviews.ts → rankings.ts → profile.ts

[Module 3] API Routes
  → /api/users → /api/matches → /api/matches/[id]/participants → /api/reviews

[Module 4] Server Components 연동
  → matches/page.tsx → rankings/page.tsx → profile/page.tsx → home/page.tsx

[Module 5] Client Components 연동
  → MatchRegisterForm.tsx → ReviewFlow.tsx
```

### 11.2 주요 구현 주의사항

1. **createMatch 트랜잭션**: matches insert 후 match_participants bulk insert. Supabase는 트랜잭션 미지원이므로 matches insert 성공 후 participants insert 실패 시 matches 롤백 코드 필요.

2. **rankings 집계**: Supabase JS client에서 raw SQL 실행은 `supabase.rpc()` 또는 `.from().select()` 체이닝. 복잡한 GROUP BY는 `rpc` 또는 Supabase View 사용 권장.

3. **review_status 계산**: `getMatches()`에서 userId를 받아 각 경기별로 내 리뷰 제출 수를 서브쿼리로 포함.

4. **home/page.tsx**: 현재 Server Component이지만 "리뷰 대기" 카드의 `hoursLeft` 계산에 `Date.now()` 필요 → 서버에서 계산 후 props로 전달.

### 11.3 Session Guide

| Module | 파일 수 | 예상 작업량 | 설명 |
|--------|---------|------------|------|
| module-1 | 0 (MCP) | 소 | DB 마이그레이션 |
| module-2 | 6 | 중 | types + lib/queries 전체 |
| module-3 | 5 | 중 | API Routes 전체 |
| module-4 | 4 | 소 | Server Component 연동 |
| module-5 | 2 | 중 | Client Component 연동 (useEffect, state 추가) |

**추천 세션 분할:**
- Session 1: `--scope module-1,module-2,module-3` (기반 구성)
- Session 2: `--scope module-4,module-5` (프론트 연동)
