"use server";

import { BetPick } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { placeBet } from "@/lib/betting";
import { redirectWithToast } from "@/lib/redirect";

const betSchema = z.object({
  matchId: z.string().min(1),
  pick: z.nativeEnum(BetPick),
  stake: z.coerce.bigint().positive()
});

export async function placeBetAction(formData: FormData) {
  const user = await requireUser();
  const parsed = betSchema.safeParse({
    matchId: formData.get("matchId"),
    pick: formData.get("pick"),
    stake: formData.get("stake")
  });

  if (!parsed.success) {
    redirectWithToast("/", "error", "下注信息无效");
  }

  try {
    await placeBet(user.id, parsed.data.matchId, parsed.data.pick, parsed.data.stake);
  } catch (error) {
    redirectWithToast("/", "error", error instanceof Error ? error.message : "下注失败");
  }

  revalidatePath("/");
  revalidatePath("/bets");
  redirectWithToast("/", "ok", "下注成功");
}
