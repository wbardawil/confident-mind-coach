import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

function isClerkReady(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  const isReal = (key: string, prefix: string) =>
    key.startsWith(prefix) &&
    !key.includes("...") &&
    !key.includes("placeholder") &&
    key.length > 30;
  return isReal(pk, "pk_") && isReal(sk, "sk_");
}

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  // When Clerk keys are missing or placeholders, skip auth entirely
  if (!isClerkReady()) {
    return NextResponse.next();
  }

  // Dynamically import Clerk only when keys are valid
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks/clerk",
    "/api/stripe/webhook",
  ]);

  const handler = clerkMiddleware((auth, request) => {
    if (!isPublicRoute(request)) {
      auth().protect();
    }
  });

  return handler(req, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
