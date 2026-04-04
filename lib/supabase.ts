import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 (Service Role Key) — 클라이언트 컴포넌트에서 사용 금지
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
