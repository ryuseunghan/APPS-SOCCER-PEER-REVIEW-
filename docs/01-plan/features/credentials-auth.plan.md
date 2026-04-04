# Plan: ID/비밀번호 인증 + 회원가입

> **Feature Key**: `credentials-auth`
> **Date**: 2026-04-04
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Kakao OAuth 연동이 지속적으로 Configuration 오류를 발생시켜 실제 서비스 로그인이 불가능한 상태. OAuth 의존성 제거가 필요함 |
| **Solution** | Kakao OAuth를 완전히 제거하고 NextAuth Credentials Provider + Supabase(users 테이블) 기반 ID/비밀번호 인증으로 교체. bcryptjs 해싱 적용 |
| **Function UX Effect** | 랜딩(/)에 로그인 폼 직접 노출. /signup 신규 페이지에서 이름·ID·비밀번호·등번호 입력 후 회원가입. 인증 성공 시 /home 진입 |
| **Core Value** | OAuth 외부 의존성 없이 자체 계정 시스템으로 신뢰할 수 있는 사용자 식별 확보. Supabase DB 연동의 기반 마련 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | Kakao OAuth 실패로 서비스 로그인 자체가 불가. 독립적인 자체 인증 시스템이 필요 |
| **WHO** | Happy Life FC 동호회원 (가입 후 경기 리뷰 참여) |
| **RISK** | Supabase 프로젝트 신규 생성 필요 (env vars 설정 선행). bcrypt 해싱은 Edge Runtime 미지원 → API Route(Node.js) 에서만 처리 |
| **SUCCESS** | 로그인 성공 → /home 진입, 미인증 시 / 리다이렉트, 회원가입 후 즉시 로그인 가능 |
| **SCOPE** | auth.ts 교체, landing page 교체, /signup 신규, Supabase users 테이블, bcryptjs |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | Kakao OAuth 관련 코드 완전 제거 (auth.ts, app/page.tsx, env vars) | Must |
| FR-02 | NextAuth Credentials Provider로 ID/비밀번호 로그인 구현 | Must |
| FR-03 | 랜딩 페이지(/)에 ID + 비밀번호 로그인 폼 표시 | Must |
| FR-04 | /signup 신규 페이지: 이름, ID, 비밀번호, 등번호 입력 후 회원가입 | Must |
| FR-05 | Supabase users 테이블에 사용자 정보 저장 (비밀번호 bcryptjs 해싱) | Must |
| FR-06 | 로그인 성공 시 /home 리다이렉트, 실패 시 오류 메시지 표시 | Must |
| FR-07 | 회원가입 완료 후 자동 로그인 처리 (또는 로그인 페이지로 이동) | Must |
| FR-08 | 기존 proxy.ts 라우트 보호 로직 유지 | Must |

### 1.2 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 보안 | 비밀번호는 bcryptjs(saltRounds=12)로 해싱하여 저장, 평문 저장 절대 금지 |
| 런타임 | bcrypt는 Node.js API Route에서만 처리 (Edge Runtime 불가) |
| 세션 | NextAuth JWT 세션 유지 (기존 구조 변경 없음) |
| 유효성 | 로그인/회원가입 폼 클라이언트 + 서버 양쪽 검증 |

### 1.3 제외 범위

- 포지션(GK/DF/MF/FW) 필드 — 수집하지 않음
- 소셜 로그인 (Kakao, Google 등)
- 이메일 인증
- 비밀번호 찾기/재설정

---

## 2. 기술 스택 및 아키텍처

### 2.1 사용 기술

| 역할 | 기술 |
|------|------|
| 인증 프레임워크 | next-auth@beta (v5 Credentials Provider) |
| 데이터베이스 | Supabase (PostgreSQL) |
| Supabase 클라이언트 | @supabase/supabase-js (이미 설치됨) |
| 비밀번호 해싱 | bcryptjs |
| 세션 | JWT (기존 구조 유지) |

### 2.2 환경 변수 변경

**제거:**
```
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
```

**추가:**
```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
SUPABASE_SERVICE_ROLE_KEY=<service role key>  # 서버 전용 (users 쓰기)
AUTH_SECRET=<기존 유지>
AUTH_URL=<기존 유지>
```

---

## 3. 데이터 모델

### 3.1 Supabase users 테이블

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT UNIQUE NOT NULL,        -- 로그인 ID
  name        TEXT NOT NULL,               -- 이름
  jersey_number INT,                       -- 등번호 (nullable)
  password_hash TEXT NOT NULL,             -- bcryptjs 해시
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 NextAuth 세션 토큰 페이로드

```ts
{
  sub: string,       // user UUID
  name: string,      // 이름
  username: string,  // 로그인 ID
  jerseyNumber: number | null
}
```

---

## 4. 구현 범위

### 4.1 변경 파일

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `auth.ts` | 교체 | Kakao → Credentials Provider |
| `app/page.tsx` | 교체 | 카카오 버튼 → 로그인 폼 |
| `.env.local` | 수정 | Kakao vars 제거, Supabase vars 추가 |

### 4.2 신규 파일

| 파일 | 내용 |
|------|------|
| `lib/supabase.ts` | Supabase 서버 클라이언트 생성 |
| `lib/auth-helpers.ts` | 사용자 조회/생성 헬퍼 (bcrypt 포함) |
| `app/signup/page.tsx` | 회원가입 페이지 (클라이언트 컴포넌트) |
| `app/api/signup/route.ts` | 회원가입 API (POST, Node.js runtime) |

### 4.3 유지 파일 (변경 없음)

| 파일 | 이유 |
|------|------|
| `proxy.ts` | 라우트 보호 로직 동일 |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth 핸들러 그대로 |
| `components/Providers.tsx` | SessionProvider 변경 없음 |
| `components/SideNav.tsx` | useSession 사용 그대로 |

---

## 5. 로그인 플로우

```
사용자 → / (로그인 폼)
  ↓ ID + 비밀번호 입력
NextAuth signIn("credentials", { username, password })
  ↓
auth.ts Credentials authorize()
  ↓ Supabase에서 username으로 사용자 조회
  ↓ bcrypt.compare(password, password_hash)
  ↓ 성공 → user 객체 반환
NextAuth JWT 세션 생성
  ↓
/home 리다이렉트
```

---

## 6. 회원가입 플로우

```
사용자 → /signup
  ↓ 이름, ID, 비밀번호, 등번호 입력
POST /api/signup
  ↓ username 중복 확인
  ↓ bcrypt.hash(password, 12)
  ↓ Supabase users INSERT
  ↓ 성공 → /로 리다이렉트 (로그인 폼)
```

---

## 7. 성공 기준

| 항목 | 기준 |
|------|------|
| SC-01 | 올바른 ID/비밀번호 로그인 시 /home 진입 |
| SC-02 | 잘못된 비밀번호 시 "아이디 또는 비밀번호가 올바르지 않습니다" 오류 표시 |
| SC-03 | 미인증 상태에서 /home 접근 시 /로 리다이렉트 |
| SC-04 | 회원가입 후 / 에서 새 계정으로 로그인 성공 |
| SC-05 | 중복 ID 회원가입 시 "이미 사용 중인 아이디입니다" 오류 표시 |
| SC-06 | Kakao 관련 코드/버튼이 앱 전체에서 완전히 제거됨 |

---

## 8. 리스크 및 의존성

| 리스크 | 대응 |
|--------|------|
| Supabase 프로젝트 미생성 | 구현 전 Supabase 프로젝트 생성 및 env vars 설정 필요 (사용자 선행 작업) |
| bcrypt Edge Runtime 미지원 | 회원가입/인증 로직을 `/api/signup` (Node.js runtime)과 `auth.ts` authorize (Node.js only)에서만 처리 |
| 기존 세션 무효화 | Kakao 세션이 있던 사용자는 재로그인 필요 (신규 시스템이므로 허용) |
