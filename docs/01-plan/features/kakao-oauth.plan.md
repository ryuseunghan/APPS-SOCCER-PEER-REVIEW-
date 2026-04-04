# Plan: Kakao OAuth 인증 연동

> **Feature Key**: `kakao-oauth`
> **Date**: 2026-04-04
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 "카카오로 시작하기" 버튼이 실제 인증 없이 `/home`으로 바로 이동함. 실제 서비스 배포 시 누구나 다른 사용자 데이터에 접근 가능한 보안 공백 존재 |
| **Solution** | NextAuth.js v5 (Auth.js) + Kakao Provider로 실제 OAuth 2.0 인증 플로우 구현. JWT 세션으로 로그인 상태 유지, 보호 라우트 적용 |
| **Function UX Effect** | 랜딩 → 카카오 로그인 → (main) 라우트 자동 진입. 비로그인 시 랜딩으로 리다이렉트. 세션에 닉네임·이메일 포함 |
| **Core Value** | 실제 사용자 식별 기반으로 피어리뷰 데이터 신뢰성 확보. 이후 Supabase DB 연동의 기반 마련 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 실제 서비스 환경에서 사용자 식별 없이는 리뷰/레이팅 데이터 신뢰 불가. 배포 전 인증 연동 필수 |
| **WHO** | Happy Life FC 동호회원 — 카카오 계정 보유자 (20~40대 국내 사용자) |
| **RISK** | Kakao Developers 앱 설정 오류로 redirect_uri_mismatch 발생 가능. NEXTAUTH_SECRET 미설정 시 프로덕션 세션 오류 |
| **SUCCESS** | 카카오 로그인 성공 → `/home` 진입. 비로그인 시 `/(main)` 라우트 접근 차단. 세션에서 닉네임 조회 가능 |
| **SCOPE** | 인증(로그인/로그아웃)만. Supabase DB 저장, 사용자별 데이터 분리는 다음 단계 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | 랜딩 페이지 "카카오로 시작하기" 버튼 클릭 시 Kakao OAuth 인가 페이지로 이동 | Must |
| FR-02 | Kakao 인증 완료 후 `/home`으로 리다이렉트 | Must |
| FR-03 | `/(main)` 하위 라우트 전체에 로그인 인증 미들웨어 적용 | Must |
| FR-04 | 미인증 사용자가 `/(main)` 접근 시 랜딩(`/`)으로 리다이렉트 | Must |
| FR-05 | 세션에서 카카오 닉네임, 이메일 접근 가능 | Must |
| FR-06 | 로그아웃 기능 (사이드바 또는 프로필 메뉴) | Should |
| FR-07 | 로그인 중 UI (로딩 상태) | Should |

### 1.2 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| **보안** | NEXTAUTH_SECRET 환경변수 필수. 프로덕션에서 HTTPS only |
| **호환성** | Next.js 16.2.2 App Router + NextAuth v5 (Auth.js) |
| **세션 전략** | JWT (DB 어댑터 없음, 이 단계에서는 Supabase 미연동) |
| **배포** | Vercel 환경변수에 KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL 등록 |

---

## 2. Kakao Developers 앱 설정 — 필요 정보 체크리스트

> **이 단계에서 사용자가 준비해야 할 정보입니다.**

### 2.1 developers.kakao.com 에서 확인/설정할 항목

#### Step 1. REST API 키 확인
- 내 애플리케이션 → 앱 선택 → 앱 키 → **REST API 키** 복사
- 이것이 `KAKAO_CLIENT_ID` 환경변수 값

#### Step 2. Client Secret 발급
- 내 애플리케이션 → 앱 선택 → 보안 → **Client Secret**
- "코드 생성" 클릭 후 활성화 상태로 전환
- 이것이 `KAKAO_CLIENT_SECRET` 환경변수 값

#### Step 3. Redirect URI 등록
- 내 애플리케이션 → 앱 선택 → 카카오 로그인 → **Redirect URI**
- 아래 두 URI를 모두 등록:

```
http://localhost:3000/api/auth/callback/kakao
https://{your-vercel-url}/api/auth/callback/kakao
```

#### Step 4. 카카오 로그인 활성화
- 카카오 로그인 → **활성화 설정** → ON

#### Step 5. 동의항목 설정
- 카카오 로그인 → 동의항목
- 아래 항목 설정:

| 항목 | 설정값 | 비고 |
|------|--------|------|
| 닉네임 | 필수 동의 | `profile_nickname` |
| 카카오계정(이메일) | 선택 동의 | `account_email` |
| 프로필 사진 | 선택 동의 (optional) | `profile_image` |

#### Step 6. Web 플랫폼 등록
- 플랫폼 → Web → **사이트 도메인 등록**:

```
http://localhost:3000
https://{your-vercel-url}
```

### 2.2 필요한 환경변수 정리

`.env.local` (로컬 개발):
```env
KAKAO_CLIENT_ID=여기에_REST_API_키
KAKAO_CLIENT_SECRET=여기에_Client_Secret
NEXTAUTH_SECRET=랜덤_32바이트_문자열  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

Vercel 환경변수 (프로덕션):
```env
KAKAO_CLIENT_ID=여기에_REST_API_키
KAKAO_CLIENT_SECRET=여기에_Client_Secret
NEXTAUTH_SECRET=랜덤_32바이트_문자열  # 로컬과 동일하게
NEXTAUTH_URL=https://{your-vercel-url}
```

> **NEXTAUTH_SECRET 생성 방법:**
> 터미널에서 `openssl rand -base64 32` 실행

---

## 3. 구현 범위

### 3.1 파일 목록

**신규 생성:**
| 파일 | 역할 |
|------|------|
| `auth.ts` (루트) | NextAuth 설정 — Kakao Provider, session 콜백 |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth API 라우트 핸들러 |
| `middleware.ts` (루트) | `/(main)` 보호 미들웨어 |
| `.env.local` | 로컬 환경변수 (gitignore됨) |

**수정:**
| 파일 | 변경 내용 |
|------|---------|
| `app/page.tsx` | "카카오로 시작하기" → `signIn('kakao')` 호출로 변경 |
| `components/SideNav.tsx` | 로그아웃 버튼 추가, 세션 닉네임 표시 |
| `package.json` | `next-auth@beta` 패키지 추가 |

### 3.2 인증 플로우

```
[랜딩 /]
  → 카카오로 시작하기 클릭
  → signIn('kakao') 호출
  → Kakao 인가 페이지 (accounts.kakao.com)
  → 사용자 로그인 + 동의
  → /api/auth/callback/kakao (NextAuth 자동 처리)
  → JWT 세션 생성 (name, email 포함)
  → /home 리다이렉트

[미인증 접근]
  → middleware.ts에서 세션 확인
  → 없으면 / 로 리다이렉트
```

---

## 4. 성공 기준

| ID | 기준 | 검증 방법 |
|----|------|---------|
| SC-01 | 카카오 로그인 성공 시 `/home` 진입 | 브라우저에서 직접 확인 |
| SC-02 | 비로그인 상태에서 `/home` 직접 접근 시 `/`로 리다이렉트 | URL 직접 입력 테스트 |
| SC-03 | 로컬(`localhost:3000`)과 프로덕션(Vercel) 모두 동작 | 배포 후 확인 |
| SC-04 | 세션에서 `session.user.name` (닉네임) 조회 가능 | 콘솔 로그 또는 UI 표시 확인 |
| SC-05 | 로그아웃 후 `/(main)` 접근 차단 | 로그아웃 후 `/home` 접근 테스트 |

---

## 5. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| `redirect_uri_mismatch` 오류 | 높음 | Kakao Developers에서 정확한 URI 등록 확인 |
| `NEXTAUTH_SECRET` 미설정으로 프로덕션 오류 | 중간 | Vercel 환경변수 배포 전 반드시 확인 |
| NextAuth v5 (beta) API 변경 | 낮음 | 공식 문서 기준으로 구현, `auth.ts` 패턴 사용 |
| Kakao 이메일 미제공 사용자 | 중간 | email을 optional로 처리, name만으로 세션 구성 |

---

## 6. 의존성

```bash
npm install next-auth@beta
```

> next-auth v5 (Auth.js)는 Next.js App Router와 공식 호환되는 버전

---

## 7. 제외 범위 (다음 단계)

- Supabase DB에 사용자 테이블 저장
- 사용자별 경기/리뷰 데이터 분리
- 동호회 멤버십 관리 (초대 링크 등)
- 회원가입 추가 정보 입력 (닉네임 수정, 포지션 설정)
