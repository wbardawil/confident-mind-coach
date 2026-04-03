"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

export async function completeWelcome() {
  const user = await getCurrentUser();
  if (!user?.profile) return;

  await db.profile.update({
    where: { id: user.profile.id },
    data: { welcomeCompleted: true },
  });
}
