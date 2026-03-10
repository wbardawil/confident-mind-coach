import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Clerk webhook handler for user sync
// Full implementation will be added in Phase 2 when user creation flow is built.
// This stub ensures the route exists and returns 200 for webhook verification.

export async function POST(req: Request) {
  const _headersList = headers();

  // TODO: Verify webhook signature with Clerk
  // TODO: Handle user.created and user.updated events
  // TODO: Sync user data to database via Prisma

  return NextResponse.json({ received: true }, { status: 200 });
}
