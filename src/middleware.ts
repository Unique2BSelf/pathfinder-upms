import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Routes that require authentication ────────────────────────────────────────
const PROTECTED_PREFIXES = ["/dashboard"];

// ── Routes only for unauthenticated users ─────────────────────────────────────
const AUTH_ONLY_ROUTES = ["/auth/login", "/auth/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // 1. Unauthenticated users trying to hit protected routes → login
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated users hitting auth-only routes → dashboard
  const isAuthOnly = AUTH_ONLY_ROUTES.some((p) => pathname === p);
  if (isAuthOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. Authenticated user — check onboarding gate
  if (user && pathname.startsWith("/dashboard") && !pathname.startsWith("/auth/onboarding")) {
    const { data: userData } = await supabase
      .from("users")
      .select("onboarding_step")
      .eq("id", user.id)
      .single();

    if (userData && userData.onboarding_step !== "complete") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/onboarding";
      url.searchParams.set("step", userData.onboarding_step);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/calendar).*)",
  ],
};
