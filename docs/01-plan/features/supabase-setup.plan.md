# Plan: Supabase 설정

> **Feature Key**: `supabase-setup`
> **Date**: 2026-04-05
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Supabase 패키지는 설치됐으나 DB 테이블·환경변수·클라이언트 헬퍼가 없어 `credentials-auth` 구현이 불가한 상태 |
| **Solution** | 기존 MatchRate Supabase 프로젝트에 `users` 테이블 마이그레이션, `.env.local` 설정, `lib/supabase.ts` 클라이언트 헬퍼 생성 |
| **Function UX Effect** | 개발자 관점: 이후 모든 DB 작업을 `createServerClient()` 한 줄로 시작 가능한 상태 |
| **Core Value** | `credentials-auth` 및 이후 모든 기능의 데이터 레이어 기반 완성 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | `credentials-auth` 플랜의 선행 조건. Supabase users 테이블 없이 로그인/회원가입 구현 불가 |
| **WHO** | 개발자 (설정 작업) — 최종 사용자에게 직접 노출되지 않음 |
| **RISK** | env vars 누락 시 런타임 오류. Service Role Key 노출 금지 (서버 전용) |
| **SUCCESS** | `lib/supabase.ts` import 후 `createServerClient()` 호출 성공, users 테이블 존재 확인 |
| **SCOPE** | DB 마이그레이션, env vars, lib/supabase.ts — 인증 로직 미포함 |

---

## 1. 현황

### 1.1 Supabase 프로젝트

| 항목 | 값 |
|------|-----|
| **프로젝트명** | MatchRate |
| **Project ID** | `xdwuasfxyhbuhlpttbnb` |
| **리전** | ap-northeast-2 (서울) |
| **상태** | ACTIVE_HEALTHY |
| **DB 버전** | PostgreSQL 17.6 |
| **기존 테이블** | 없음 (신규 생성 필요) |

### 1.2 이미 설치된 패키지

```
@supabase/ssr        ^0.10.0  ✅
@supabase/supabase-js ^2.101.1 ✅
```

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `users` 테이블 생성 (MCP 마이그레이션) | Must |
| FR-02 | `.env.local`에 Supabase 환경변수 추가 | Must |
| FR-03 | `lib/supabase.ts` 서버 클라이언트 헬퍼 생성 | Must |
| FR-04 | RLS 비활성화 (Service Role Key 전용 접근) | Must |

### 2.2 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 보안 | `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용, 클라이언트 노출 금지 |
| 환경 | `.env.local`은 git에 커밋하지 않음 (`.gitignore` 확인) |
| 호환성 | Next.js App Router + `@supabase/ssr` 패턴 사용 |

### 2.3 제외 범위

- 인증 로직 (→ `credentials-auth` 플랜에서 처리)
- Storage, Realtime, Edge Functions
- 스테이징/프로덕션 환경 분리

---

## 3. 데이터 모델

### 3.1 users 테이블

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,      -- 로그인 ID
  name          TEXT NOT NULL,             -- 이름
  jersey_number INT,                       -- 등번호 (nullable)
  password_hash TEXT NOT NULL,             -- bcryptjs 해시
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 RLS 설정

```sql
-- RLS 비활성화 (Service Role Key로만 접근)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

---

## 4. 환경변수

### 4.1 추가할 변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xdwuasfxyhbuhlpttbnb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드 > Settings > API > service_role>
```

> `NEXT_PUBLIC_SUPABASE_URL`은 클라이언트에 노출돼도 안전.
> `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에서 사용 금지.

---

## 5. 구현 범위

### 5.1 신규 파일

| 파일 | 내용 |
|------|------|
| `lib/supabase.ts` | `createServerClient()` 헬퍼 (service role key 사용) |

### 5.2 변경 파일

| 파일 | 내용 |
|------|------|
| `.env.local` | Supabase env vars 추가 |

### 5.3 DB 작업 (MCP)

| 작업 | 방법 |
|------|------|
| `users` 테이블 생성 | `mcp__supabase__apply_migration` |
| RLS 비활성화 | 마이그레이션에 포함 |

---

## 6. lib/supabase.ts 설계

```ts
import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 (Service Role Key)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

> `@supabase/ssr`의 `createServerClient`는 쿠키 기반 Auth용.
> 현 프로젝트는 NextAuth JWT 세션을 사용하므로 `@supabase/supabase-js`의 `createClient`로 충분.

---

## 7. 성공 기준

| ID | 기준 |
|----|------|
| SC-01 | Supabase `public.users` 테이블 존재 (MCP로 확인) |
| SC-02 | `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정 |
| SC-03 | `lib/supabase.ts`에서 `createServerClient()` 호출 시 TypeScript 오류 없음 |
| SC-04 | `credentials-auth` 구현 시 추가 Supabase 설정 작업 불필요 |

---

## 8. 리스크

| 리스크 | 대응 |
|--------|------|
| Service Role Key 노출 | 서버 코드에서만 사용, env var 접두사 없음 (`SUPABASE_` 사용) |
| `.env.local` 미설정으로 런타임 오류 | `!` 단언 사용, 누락 시 즉시 에러 발생 → 빠른 발견 |
| 패키지 버전 불일치 | `@supabase/supabase-js` v2 API 사용 (현재 설치 버전 일치) |

---

## 9. 구현 순서

```
1. Supabase 대시보드에서 service_role key 복사
2. .env.local 에 env vars 추가
3. MCP로 users 테이블 마이그레이션 실행
4. lib/supabase.ts 생성
5. SC-01~04 검증
6. credentials-auth 구현으로 이동
```
