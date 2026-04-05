# Design: 이메일 인증 기반 회원가입

> **Feature Key**: `email-verification-signup`
> **Date**: 2026-04-05
> **Architecture**: Option C — Pragmatic Balance
> **Phase**: Design

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 허위 계정 방지 + username/email 혼용 구조 정리 → 서비스 신뢰도 향상 |
| **WHO** | Happy Life FC 신규 가입 희망자 |
| **RISK** | Resend API 키 설정, DB 마이그레이션(username→email), 기존 사용자 데이터 보존 |
| **SUCCESS** | OTP 없이 가입 불가, 중복 이메일 차단, 비밀번호 확인 필수 |
| **SCOPE** | app/signup, app/api/signup/[send-code|verify-code], lib/email.ts, auth.ts, Supabase |

---

## 1. Overview

### 1.1 아키텍처 결정

**Option C — Pragmatic Balance** 채택.

- API 엔드포인트는 `send-code` / `verify-code`로 역할 분리
- `lib/email.ts`만 추가 (Resend 클라이언트 + 이메일 템플릿)
- OTP 생성/검증 로직은 route 핸들러에 인라인 (별도 lib 불필요)
- 기존 `lib/auth-helpers.ts`의 `getUserByUsername` → `getUserByEmail`로 수정

### 1.2 데이터 흐름

```
[Step 1] 정보 입력 폼
  → POST /api/signup/send-code
    → email 중복 확인
    → 6자리 OTP 생성
    → email_verifications INSERT
    → Resend 이메일 발송
  ← { success: true }

[Step 2] 인증번호 입력 (5분 타이머)
  → POST /api/signup/verify-code
    → email_verifications에서 OTP 조회
    → expires_at 검증
    → code 일치 확인
    → bcrypt.hash(password)
    → users INSERT (email 컬럼)
    → email_verifications.used = true
  ← { success: true }
  → router.push("/")
```

---

## 2. 데이터 모델

### 2.1 users 테이블 변경

```sql
-- Supabase Migration
ALTER TABLE users RENAME COLUMN username TO email;
```

변경 후 스키마:
```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,   -- 기존 username → email
  name          TEXT NOT NULL,
  jersey_number INT,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

> 기존 데이터(`jorzor99@gmail.com`)는 컬럼명만 변경되므로 그대로 보존됨.

### 2.2 email_verifications 테이블 (신규)

```sql
CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ev_email_created ON email_verifications(email, created_at DESC);
```

---

## 3. 컴포넌트 구조

### 3.1 파일 구조

```
app/
├── signup/
│   └── page.tsx              ← Step1Form + Step2OtpForm 통합 (수정)
├── api/
│   └── signup/
│       ├── send-code/
│       │   └── route.ts      ← 신규 (기존 route.ts 대체)
│       └── verify-code/
│           └── route.ts      ← 신규
├── page.tsx                  ← 로그인 폼 username → email (수정)
lib/
├── email.ts                  ← 신규 (Resend 클라이언트 + 템플릿)
├── auth-helpers.ts           ← getUserByEmail로 수정
└── supabase.ts               ← 변경 없음
auth.ts                       ← credentials에서 email 필드 사용 (수정)
```

---

## 4. API 명세

### 4.1 POST /api/signup/send-code

**Request:**
```typescript
{
  email: string;       // 이메일 (형식 검증 필요)
  name: string;        // 이름
  password: string;    // 비밀번호 (서버에서 임시 저장 안 함, verify에서 받음)
  jerseyNumber: number | null;
}
```

**Response:**
```typescript
// 200
{ success: true }

// 400 - 필수값 누락 또는 이메일 형식 오류
{ error: "이메일 형식이 올바르지 않습니다." }

// 409 - 중복 이메일
{ error: "이미 사용 중인 이메일입니다." }

// 500 - 발송 실패
{ error: "이메일 발송에 실패했습니다." }
```

**서버 로직:**
```typescript
1. email 형식 검증 (regex 또는 간단한 includes("@"))
2. supabase.from("users").select().eq("email", email).maybeSingle()
3. 중복이면 409
4. crypto.randomInt(100000, 999999).toString() → code
5. email_verifications INSERT { email, code, expires_at: new Date(Date.now() + 5*60*1000) }
6. sendVerificationEmail(email, code)  ← lib/email.ts
7. 200 반환
```

### 4.2 POST /api/signup/verify-code

**Request:**
```typescript
{
  email: string;
  code: string;        // 6자리 인증번호
  name: string;
  password: string;
  jerseyNumber: number | null;
}
```

**Response:**
```typescript
// 200
{ success: true }

// 401 - 코드 불일치
{ error: "인증번호가 올바르지 않습니다." }

// 410 - 만료
{ error: "인증번호가 만료되었습니다. 재발송 후 다시 시도해주세요." }

// 500 - DB 오류
{ error: "회원가입에 실패했습니다." }
```

**서버 로직:**
```typescript
1. email_verifications에서 최신 미사용 레코드 조회
   .eq("email", email).eq("used", false).order("created_at", desc).limit(1).single()
2. 없으면 401
3. expires_at < now() 이면 410
4. record.code !== code 이면 401
5. bcrypt.hash(password, 12)
6. users INSERT { email, name, password_hash, jersey_number }
7. email_verifications UPDATE { used: true }
8. 200 반환
```

---

## 5. UI 설계

### 5.1 회원가입 페이지 — Step 1 (정보 입력)

```
┌─────────────────────────────┐
│       [클럽 배지]            │
│       회원가입               │
│   Happy Life FC 멤버로       │
│                             │
│  [이름          ]           │
│  [이메일        ]           │
│  [비밀번호      ]           │
│  [비밀번호 확인  ]           │  ← 불일치 시 실시간 오류 표시
│  [등번호(선택)  ]           │
│                             │
│  [오류 메시지]               │
│                             │
│  [    인증번호 받기    ]     │
│                             │
│  이미 계정이 있으신가요? 로그인 │
└─────────────────────────────┘
```

**비밀번호 확인 로직:**
```typescript
// 실시간 검증 (onChange)
const passwordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

// 버튼 disabled 조건
disabled={loading || passwordMismatch || !password || !passwordConfirm}
```

### 5.2 회원가입 페이지 — Step 2 (인증번호 입력)

```
┌─────────────────────────────┐
│       [클럽 배지]            │
│       이메일 인증            │
│  user@example.com 으로       │
│  인증번호를 발송했습니다      │
│                             │
│  ┌──── 남은 시간: 04:32 ────┐│  ← 실시간 카운트다운
│  └─────────────────────────┘│
│                             │
│  [인증번호 6자리   ]         │
│                             │
│  [오류 메시지]               │
│                             │
│  [    확인    ]             │
│                             │
│  [재발송] ← 타이머 만료 시만 활성│
└─────────────────────────────┘
```

**타이머 로직:**
```typescript
const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
const [expired, setExpired] = useState(false);

useEffect(() => {
  if (timeLeft <= 0) { setExpired(true); return; }
  const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
  return () => clearInterval(timer);
}, [timeLeft]);

// 표시: MM:SS
const display = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
```

---

## 6. lib/email.ts 설계

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(to: string, code: string) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
    subject: "[Happy Life FC] 이메일 인증번호",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Happy Life FC 이메일 인증</h2>
        <p>아래 인증번호를 입력해주세요. 유효시간은 <strong>5분</strong>입니다.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                    text-align: center; padding: 24px; background: #f3f4f6; 
                    border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          본인이 요청하지 않은 경우 이 이메일을 무시하세요.
        </p>
      </div>
    `,
  });
}
```

---

## 7. auth.ts 수정 사항

```typescript
// Before
const user = await getUserByUsername(username);

// After
const user = await getUserByEmail(username); // credentials 필드명은 유지, 값은 email
```

credentials 필드명도 변경:
```typescript
credentials: {
  email: {},    // username → email
  password: {},
},
async authorize(credentials) {
  const email = credentials?.email as string;
  ...
  const user = await getUserByEmail(email);
```

로그인 폼(`app/page.tsx`)의 name/placeholder도 `email`로 수정.

---

## 8. Supabase 마이그레이션 순서

```sql
-- Step 1: 컬럼명 변경
ALTER TABLE users RENAME COLUMN username TO email;

-- Step 2: email_verifications 테이블 생성
CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ev_email_created ON email_verifications(email, created_at DESC);
```

---

## 9. 환경변수 추가 (Vercel + .env.local)

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev   # 테스트용 (프로덕션은 인증된 도메인)
```

---

## 10. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| T1 | 신규 이메일로 가입 → 코드 발송 → 올바른 코드 입력 | 계정 생성 → /로 이동 |
| T2 | 이미 가입된 이메일로 send-code | "이미 사용 중인 이메일" 오류 |
| T3 | 잘못된 코드 입력 | "인증번호가 올바르지 않습니다" |
| T4 | 5분 후 코드 입력 | "인증번호가 만료되었습니다" |
| T5 | 타이머 만료 후 재발송 → 새 코드 인증 | 계정 생성 성공 |
| T6 | 비밀번호 ≠ 비밀번호 확인 | 버튼 비활성화 / 오류 표시 |
| T7 | 새 이메일로 로그인 (email + password) | /home 진입 성공 |

---

## 11. Implementation Guide

### 11.1 구현 순서

1. **Supabase 마이그레이션** — DB 스키마 먼저 변경
2. **lib/email.ts** — Resend 클라이언트 생성
3. **lib/auth-helpers.ts** — getUserByEmail 수정
4. **auth.ts** — email 필드 사용으로 수정
5. **app/api/signup/send-code/route.ts** — 신규 생성
6. **app/api/signup/verify-code/route.ts** — 신규 생성
7. **app/signup/page.tsx** — Step1 + Step2 + 타이머 UI
8. **app/page.tsx** — 로그인 폼 email 레이블 수정
9. **환경변수 설정** — RESEND_API_KEY 추가 (로컬 + Vercel)
10. **기존 /api/signup/route.ts 삭제**

### 11.2 의존성 설치

```bash
npm install resend
```

### 11.3 Session Guide

**Module Map:**

| Module | 파일 | 난이도 |
|--------|------|--------|
| M1: DB 마이그레이션 | Supabase SQL | 낮음 |
| M2: 이메일 서비스 | lib/email.ts | 낮음 |
| M3: auth 수정 | auth.ts, lib/auth-helpers.ts | 낮음 |
| M4: send-code API | app/api/signup/send-code/route.ts | 중간 |
| M5: verify-code API | app/api/signup/verify-code/route.ts | 중간 |
| M6: 회원가입 UI | app/signup/page.tsx | 높음 |
| M7: 로그인 폼 수정 | app/page.tsx | 낮음 |

**추천 세션 분할:**
- Session 1: M1 + M2 + M3 (인프라/서비스 레이어)
- Session 2: M4 + M5 (API 레이어)
- Session 3: M6 + M7 (UI 레이어)
