import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { locales, routing } from "@/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export const middleware = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    const sessionResponse = await updateSession(request);
    const intlResponse = intlMiddleware(request);

    sessionResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "x-middleware-rewrite") {
        intlResponse.headers.set(key, value);
      }
    });

    sessionResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie);
    });

    return intlResponse;
  }

  return intlMiddleware(request);
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

