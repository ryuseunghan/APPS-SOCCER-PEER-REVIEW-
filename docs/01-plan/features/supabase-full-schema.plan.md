# Plan: Supabase 전체 DB 스키마 연동

> **Feature Key**: `supabase-full-schema`
> **Date**: 2026-04-05
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 로그인 이외의 모든 화면(경기목록, 리뷰, 랭킹, 프로필)이 하드코딩된 mock 데이터를 사용하고 있어 실제 사용 불가 상태 |
| **Solution** | Supabase에 matches / match_participants / reviews / mvp_votes 테이블을 추가하고, 각 페이지를 실제 API 라우트와 연동 |
| **Function UX Effect** | 경기 등록 → 참가자 선택 → 리뷰 제출 → 랭킹·프로필 반영까지 전체 흐름이 실제 데이터로 동작 |
| **Core Value** | 앱의 핵심 가치인 "팀원이 보는 내 진짜 레이팅"을 실제 데이터로 제공 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현재 모든 UI가 mock 데이터 — 실제 경기·리뷰·레이팅 데이터 없이는 앱 가치 전달 불가 |
| **WHO** | Happy Life FC 팀원 전체 (경기 등록자 + 리뷰 참여자) |
| **RISK** | 리뷰 마감 시간 로직 복잡성, 자기 자신 리뷰 제외 처리, MVP 중복 투표 방지 |
| **SUCCESS** | 경기 등록 → 참가자 리스트 → 리뷰 제출 → 랭킹 반영 전체 흐름 실데이터로 동작 |
| **SCOPE** | DB 마이그레이션 + API 라우트 + 기존 페이지 API 연동. 실시간(Realtime)/알림 미포함 |

---

## 1. 현황 분석

### 1.1 mock 데이터 사용 현황

| 파일 | mock 데이터 | 연동 필요 API |
|------|------------|--------------|
| `app/(main)/matches/page.tsx` | `matches` 배열 (3개) | `GET /api/matches` |
| `app/(main)/matches/new/MatchRegisterForm.tsx` | `CLUB_MEMBERS` (10명) | `GET /api/users`, `POST /api/matches` |
| `app/(main)/review/[matchId]/ReviewFlow.tsx` | `PLAYERS` (9명), 평점 mock | `GET /api/matches/[id]/participants`, `POST /api/reviews` |
| `app/(main)/rankings/page.tsx` | `rankings` 배열 (9명) | `GET /api/rankings` |
| `app/(main)/profile/page.tsx` | `myProfile`, `growthData` | `GET /api/profile` |
| `app/(main)/home/page.tsx` | `myStats`, `pendingReview`, `recentMatches` | `GET /api/home` |

### 1.2 기존 users 테이블

```
users: id, email, name, jersey_number, password_hash, created_at
```
**누락 필드**: `position` (GK/DF/MF/FW) — 랭킹·리뷰 화면에서 사용

---

## 2. 요구사항

### 2.1 DB 스키마 (Must)

| ID | 요구사항 |
|----|----------|
| FR-01 | `users` 테이블에 `position` 컬럼 추가 (TEXT, nullable) |
| FR-02 | `matches` 테이블 생성 |
| FR-03 | `match_participants` 테이블 생성 (경기-참가자 junction) |
| FR-04 | `reviews` 테이블 생성 (skill/stamina/teamplay/comment) |
| FR-05 | `mvp_votes` 테이블 생성 (경기당 1인 1표) |

### 2.2 API 라우트 (Must)

| ID | 요구사항 |
|----|----------|
| FR-06 | `GET /api/matches` — 경기 목록 (참가자 수, 리뷰 상태 포함) |
| FR-07 | `POST /api/matches` — 경기 등록 (참가자 목록 함께 저장) |
| FR-08 | `GET /api/matches/[id]` — 경기 상세 |
| FR-09 | `GET /api/matches/[id]/participants` — 경기 참가자 목록 |
| FR-10 | `POST /api/reviews` — 리뷰 + MVP 투표 일괄 제출 |
| FR-11 | `GET /api/users` — 전체 멤버 목록 (경기 등록 시 사용) |
| FR-12 | `GET /api/rankings` — 전체 랭킹 (평균 평점 집계) |
| FR-13 | `GET /api/profile` — 내 프로필 (평점, 성장 그래프) |
| FR-14 | `GET /api/home` — 홈 대시보드 데이터 |

### 2.3 프론트엔드 연동 (Must)

| ID | 요구사항 |
|----|----------|
| FR-15 | `matches/page.tsx` → `GET /api/matches` 실데이터 |
| FR-16 | `MatchRegisterForm.tsx` → `GET /api/users` + `POST /api/matches` |
| FR-17 | `ReviewFlow.tsx` → `GET /api/matches/[id]/participants` + `POST /api/reviews` |
| FR-18 | `rankings/page.tsx` → `GET /api/rankings` |
| FR-19 | `profile/page.tsx` → `GET /api/profile` |
| FR-20 | `home/page.tsx` → `GET /api/home` |

### 2.4 제외 범위

- 실시간 알림 (Supabase Realtime / push)
- 경기 삭제·수정
- 리뷰 수정·삭제
- Supabase Auth (NextAuth 유지)

---

## 3. 데이터 모델

### 3.1 users 테이블 변경

```sql
ALTER TABLE users ADD COLUMN position TEXT;
-- 값: 'GK' | 'DF' | 'MF' | 'FW' | NULL
```

### 3.2 matches 테이블

```sql
CREATE TABLE matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  place            TEXT NOT NULL,
  our_score        INT,                          -- NULL = 아직 진행 전
  opponent_score   INT,
  review_deadline  TIMESTAMPTZ,                 -- 경기 후 48시간
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 match_participants 테이블

```sql
CREATE TABLE match_participants (
  match_id  UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id)   ON DELETE CASCADE,
  PRIMARY KEY (match_id, user_id)
);
```

### 3.4 reviews 테이블

```sql
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID REFERENCES matches(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES users(id),
  reviewee_id  UUID REFERENCES users(id),
  skill        INT  NOT NULL CHECK (skill BETWEEN 1 AND 5),
  stamina      INT  NOT NULL CHECK (stamina BETWEEN 1 AND 5),
  teamplay     INT  NOT NULL CHECK (teamplay BETWEEN 1 AND 5),
  comment      TEXT CHECK (char_length(comment) <= 50),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, reviewer_id, reviewee_id)   -- 경기당 동일 조합 중복 방지
);
```

### 3.5 mvp_votes 테이블

```sql
CREATE TABLE mvp_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID REFERENCES matches(id) ON DELETE CASCADE,
  voter_id      UUID REFERENCES users(id),
  voted_for_id  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, voter_id),                  -- 경기당 1인 1표
  CHECK (voter_id != voted_for_id)              -- 자기 자신 투표 불가
);
```

---

## 4. 비즈니스 로직

### 4.1 리뷰 상태 (`review_status`) 도출 규칙

```
matches 테이블에 status 컬럼 없음 — API에서 다음 규칙으로 도출:

upcoming  : date+time > NOW()
pending   : date+time <= NOW() AND review_deadline > NOW() AND 내가 아직 리뷰 미제출
completed : 내가 모든 참가자 리뷰 제출 완료
closed    : review_deadline < NOW()
```

### 4.2 overall 평점 계산

```
overall = ROUND((skill + stamina + teamplay) / 3.0, 1)
```

집계는 `reviews` 테이블에서 `reviewee_id` 기준 AVG 쿼리로 계산. 별도 컬럼에 캐시하지 않음.

### 4.3 review_deadline

경기 등록(`POST /api/matches`) 시:
```
review_deadline = TIMESTAMP(date + ' ' + time) + INTERVAL '48 hours'
```

---

## 5. API 설계 요약

### 5.1 GET /api/matches

**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2026-04-06",
    "time": "10:00",
    "place": "풋살파크 강남 B코트",
    "our_score": null,
    "opponent_score": null,
    "participant_count": 8,
    "review_status": "upcoming",
    "review_deadline": null
  }
]
```

### 5.2 POST /api/matches

**Request:**
```json
{
  "date": "2026-04-06",
  "time": "10:00",
  "place": "풋살파크 강남 B코트",
  "our_score": null,
  "opponent_score": null,
  "participant_ids": ["uuid1", "uuid2", ...]
}
```

### 5.3 POST /api/reviews

**Request:**
```json
{
  "match_id": "uuid",
  "reviews": [
    { "reviewee_id": "uuid", "skill": 4, "stamina": 3, "teamplay": 5, "comment": "최고!" }
  ],
  "mvp_vote": "uuid"
}
```

### 5.4 GET /api/rankings

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "김민준",
    "position": "MF",
    "overall": 4.6,
    "skill": 4.9,
    "stamina": 4.3,
    "teamplay": 4.6,
    "games_played": 12,
    "mvp_count": 3
  }
]
```

### 5.5 GET /api/profile

세션 사용자 기준. `GET /api/rankings`의 단일 유저 버전 + 최근 6경기 성장 데이터.

---

## 6. 프론트엔드 수정 포인트

| 파일 | 수정 내용 |
|------|----------|
| `matches/page.tsx` | Server Component에서 `fetch /api/matches` |
| `MatchRegisterForm.tsx` | `useEffect`로 `/api/users` 로드 후 멤버 목록 렌더 |
| `ReviewFlow.tsx` | `useEffect`로 `/api/matches/[id]/participants` 로드 |
| `rankings/page.tsx` | Server Component에서 `fetch /api/rankings` |
| `profile/page.tsx` | Server Component에서 `fetch /api/profile` |
| `home/page.tsx` | Server Component에서 `fetch /api/home` |

`MatchRegisterForm.tsx`, `ReviewFlow.tsx`는 이미 `"use client"` — useEffect + fetch 패턴 적용.  
나머지 페이지는 현재 Server Component — `auth()` 세션 획득 후 직접 supabase 쿼리 또는 내부 fetch.

---

## 7. 성공 기준

| ID | 기준 |
|----|------|
| SC-01 | Supabase에 4개 신규 테이블 + users.position 컬럼 생성 완료 |
| SC-02 | 경기 등록 → DB에 match + match_participants 저장 확인 |
| SC-03 | 리뷰 제출 → DB에 reviews + mvp_votes 저장, 자기자신 리뷰 제외 동작 |
| SC-04 | 랭킹 페이지가 실DB 집계 데이터로 렌더링 |
| SC-05 | 프로필 페이지가 실DB 기반 평점·경기수·MVP 횟수 표시 |
| SC-06 | 홈 대시보드의 "리뷰 대기" 카드가 실제 미제출 경기에 대해서만 표시 |

---

## 8. 리스크

| 리스크 | 대응 |
|--------|------|
| 리뷰 아직 없는 유저의 랭킹 — NULL/0 처리 | AVG 반환 NULL → 0 또는 "-"로 표시, 경기 최소 1회 이상인 유저만 랭킹 표시 |
| 자기 자신 리뷰 제외 — 프론트/DB 이중 처리 | ReviewFlow에서 본인 제외 + reviews CHECK 미적용 (reviewer≠reviewee 제약은 필요 시 추가) |
| 참가자 0명 경기 등록 | POST /api/matches에서 participant_ids 최소 1개 이상 validation |
| Client Component에서 session userId 필요 | `useSession()` 훅으로 client에서 userId 접근 |

---

## 9. 구현 순서

```
1. DB 마이그레이션 (MCP)
   - users.position 컬럼 추가
   - matches, match_participants, reviews, mvp_votes 테이블 생성

2. API 라우트 구현 (서버)
   - GET/POST /api/matches
   - GET /api/matches/[id]/participants
   - GET /api/users
   - POST /api/reviews
   - GET /api/rankings
   - GET /api/profile
   - GET /api/home

3. 프론트엔드 연동
   - matches/page.tsx
   - MatchRegisterForm.tsx
   - ReviewFlow.tsx
   - rankings/page.tsx
   - profile/page.tsx
   - home/page.tsx
```
