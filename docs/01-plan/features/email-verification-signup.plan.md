# Plan: 이메일 인증 기반 회원가입

> **Feature Key**: `email-verification-signup`
> **Date**: 2026-04-05
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 기존 회원가입은 임의 username 기반으로 이메일 인증 없이 가입 가능. 허위/중복 계정 생성을 막을 수단이 없고, 로그인 ID가 이메일과 별개여서 관리가 불편함 |
| **Solution** | username 필드를 email로 통합하고, 가입 시 이메일 인증번호(OTP) 발송 → 5분 이내 검증 후 계정 생성. 비밀번호 확인 필드 추가로 오입력 방지 |
| **Function UX Effect** | 3단계 회원가입 플로우: ① 정보 입력(이메일·이름·비번·등번호) → ② 인증번호 입력(5분 타이머) → ③ 계정 생성 완료 후 로그인 페이지 이동 |
| **Core Value** | 실 이메일 소유자만 가입 가능한 계정 무결성 확보. 이메일 중복 방지로 1인 1계정 보장 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 허위 계정 방지 + username/email 혼용 구조 정리 → 서비스 신뢰도 향상 |
| **WHO** | Happy Life FC 동호회원 (신규 가입 희망자) |
| **RISK** | Resend API 키 설정 필요(신규 env var). DB 마이그레이션으로 기존 users 데이터 email 컬럼으로 전환 필요 |
| **SUCCESS** | 이메일 인증 없이 계정 생성 불가. 중복 이메일 가입 차단. 비밀번호 불일치 시 제출 불가 |
| **SCOPE** | app/signup/page.tsx, app/api/signup/, lib/auth-helpers.ts, auth.ts, Supabase 마이그레이션 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 회원가입 폼: username 필드 → email 필드로 교체 | Must |
| FR-02 | Supabase users 테이블: `username` 컬럼 → `email`로 마이그레이션 | Must |
| FR-03 | 회원가입 1단계: 이메일 중복 확인 후 6자리 인증번호를 이메일로 발송 | Must |
| FR-04 | 회원가입 2단계: 인증번호 입력 UI (5분 카운트다운 타이머 표시) | Must |
| FR-05 | 인증번호 검증 성공 시에만 Supabase users INSERT → 계정 생성 완료 | Must |
| FR-06 | 이미 가입된 이메일로 가입 시도 시 "이미 사용 중인 이메일입니다" 오류 | Must |
| FR-07 | 비밀번호 / 비밀번호 확인 두 필드 일치 검증 (불일치 시 제출 불가) | Must |
| FR-08 | auth.ts credentials authorize: email로 사용자 조회하도록 수정 | Must |
| FR-09 | 인증번호 재발송 버튼 (기존 코드 무효화 후 새 코드 발송) | Should |
| FR-10 | 로그인 폼: username → email 레이블/placeholder 수정 | Must |

### 1.2 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 인증번호 유효시간 | 5분 (expires_at 기반 서버 검증) |
| 인증번호 형식 | 6자리 숫자 |
| 이메일 발송 서비스 | Resend (`RESEND_API_KEY` env var 추가) |
| 보안 | 인증번호는 평문 저장 허용 (단, 1회 사용 후 즉시 만료 처리) |
| 런타임 | bcrypt, 이메일 발송 모두 Node.js API Route에서만 처리 |

### 1.3 제외 범위

- 이메일 인증 없는 로그인 유지 (기존 계정 호환성) — 마이그레이션으로 처리
- 비밀번호 재설정/찾기
- 소셜 로그인

---

## 2. 기술 스택 및 환경변수

### 2.1 신규 추가

| 역할 | 기술 |
|------|------|
| 이메일 발송 | [Resend](https://resend.com) — `npm install resend` |

### 2.2 환경변수 변경

**추가:**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com   # Resend에서 인증된 발신 주소
```

> Resend 무료 플랜: 3,000건/월. 발신 도메인은 Resend 대시보드에서 인증 필요.
> 도메인이 없으면 `onboarding@resend.dev` 사용 가능 (테스트 목적, 본인 이메일만 발송 가능).

---

## 3. 데이터 모델

### 3.1 users 테이블 마이그레이션

```sql
-- username 컬럼명 → email로 변경
ALTER TABLE users RENAME COLUMN username TO email;
```

### 3.2 email_verifications 테이블 (신규)

```sql
CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,           -- 6자리 숫자 문자열
  expires_at TIMESTAMPTZ NOT NULL,    -- 생성 시각 + 5분
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 만료 코드 자동 정리 (선택)
CREATE INDEX idx_ev_email ON email_verifications(email);
```

---

## 4. API 설계

### 4.1 POST /api/signup/send-code

**요청:**
```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "password": "...",
  "jerseyNumber": 7
}
```

**처리:**
1. email 형식 검증
2. users 테이블에서 email 중복 확인 → 중복이면 409 반환
3. 6자리 랜덤 코드 생성
4. email_verifications INSERT (expires_at = now() + 5분)
5. Resend로 인증번호 이메일 발송
6. 200 반환 (`{ success: true }`)

**응답 오류:**
- 400: 필수 항목 누락 또는 이메일 형식 오류
- 409: 이미 가입된 이메일

### 4.2 POST /api/signup/verify-code

**요청:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "name": "홍길동",
  "password": "...",
  "jerseyNumber": 7
}
```

**처리:**
1. email_verifications에서 최신 미사용 코드 조회
2. expires_at > now() 확인 (만료 시 410 반환)
3. code 일치 확인 (불일치 시 401 반환)
4. bcrypt.hash(password, 12)
5. users INSERT
6. email_verifications.used = true 업데이트
7. 200 반환 (`{ success: true }`)

**응답 오류:**
- 401: 인증번호 불일치
- 410: 인증번호 만료
- 500: DB 오류

---

## 5. 회원가입 플로우

```
[Step 1 — 정보 입력]
이름, 이메일, 비밀번호, 비밀번호 확인, 등번호(선택)
  ↓ 비밀번호 불일치 → 클라이언트 오류 표시 (제출 불가)
  ↓ 모두 유효 → POST /api/signup/send-code
  ↓ 성공 → Step 2로 전환

[Step 2 — 인증번호 입력]
6자리 숫자 입력 + 5:00부터 카운트다운 타이머
  ↓ 타이머 만료 → "재발송" 버튼 활성화
  ↓ POST /api/signup/verify-code
  ↓ 성공 → "가입 완료" 메시지 → /로 리다이렉트
```

---

## 6. 변경 파일

### 6.1 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/signup/page.tsx` | username → email, 비밀번호 확인 필드 추가, 2단계 UI + 타이머 |
| `app/page.tsx` (로그인 폼) | username placeholder → "이메일" |
| `app/api/signup/route.ts` | 삭제 후 폴더 구조로 재구성 |
| `lib/auth-helpers.ts` | `getUserByUsername` → `getUserByEmail` |
| `auth.ts` | `getUserByEmail` 사용, credentials username → email |

### 6.2 신규 파일

| 파일 | 내용 |
|------|------|
| `app/api/signup/send-code/route.ts` | 코드 발송 API |
| `app/api/signup/verify-code/route.ts` | 코드 검증 + 계정 생성 API |
| `lib/email.ts` | Resend 클라이언트 + 인증 이메일 템플릿 |

### 6.3 Supabase 마이그레이션

| 작업 | SQL |
|------|-----|
| users.username → email | `ALTER TABLE users RENAME COLUMN username TO email;` |
| email_verifications 생성 | 3.2 참조 |

---

## 7. 성공 기준

| ID | 기준 |
|----|------|
| SC-01 | 올바른 이메일+인증번호 입력 시 계정 생성 후 /로 이동 |
| SC-02 | 인증번호 없이 (또는 잘못된 코드로) 계정 생성 불가 |
| SC-03 | 만료된 코드(5분 경과) 입력 시 "인증번호가 만료되었습니다" 오류 |
| SC-04 | 이미 가입된 이메일로 재가입 시도 시 "이미 사용 중인 이메일" 오류 |
| SC-05 | 비밀번호 ≠ 비밀번호 확인 시 제출 버튼 비활성화 또는 오류 표시 |
| SC-06 | 카운트다운 타이머가 5:00 → 0:00으로 실시간 감소 |
| SC-07 | 타이머 만료 후 재발송 버튼으로 새 코드 받아 인증 가능 |
| SC-08 | 로그인 시 이메일+비밀번호로 정상 인증 |

---

## 8. 리스크 및 의존성

| 리스크 | 대응 |
|--------|------|
| Resend 도메인 미인증 | 개발/테스트 시 `onboarding@resend.dev` 사용. 프로덕션 전 도메인 인증 필요 |
| 기존 users 데이터 마이그레이션 | username → email 컬럼 변경 시 기존 데이터(jorzor99@gmail.com 등) 그대로 유지됨 |
| 인증번호 브루트포스 | 현재 범위 제외. 필요 시 횟수 제한 추가 가능 |
| Resend 발송 실패 | 5xx 에러 시 "이메일 발송에 실패했습니다" 메시지 표시 |
