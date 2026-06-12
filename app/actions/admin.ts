"use server";

import { MatchStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { settleMatch, voidMatch } from "@/lib/betting";
import { redirectWithToast } from "@/lib/redirect";
import { beijingDateTimeLocalToDate } from "@/lib/format";

const matchDetailsSchema = z.object({
  matchId: z.string().min(1),
  stage: z.string().trim().min(1),
  groupName: z.string().trim().optional(),
  homeTeam: z.string().trim().min(1),
  awayTeam: z.string().trim().min(1),
  startsAt: z.string().min(1)
});

const oddsSchema = z.object({
  matchId: z.string().min(1),
  home: z.coerce.number().positive(),
  draw: z.coerce.number().positive(),
  away: z.coerce.number().positive()
});

const scoreSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0)
});

export async function updateMatchDetailsAction(formData: FormData) {
  await requireAdmin();
  const parsed = matchDetailsSchema.safeParse({
    matchId: formData.get("matchId"),
    stage: formData.get("stage"),
    groupName: formData.get("groupName") || undefined,
    homeTeam: formData.get("homeTeam"),
    awayTeam: formData.get("awayTeam"),
    startsAt: formData.get("startsAt")
  });

  if (!parsed.success) redirectWithToast("/admin", "error", "比赛信息无效");

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      stage: parsed.data.stage,
      groupName: parsed.data.groupName || null,
      homeTeam: parsed.data.homeTeam,
      awayTeam: parsed.data.awayTeam,
      startsAt: beijingDateTimeLocalToDate(parsed.data.startsAt)
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithToast("/admin", "ok", "比赛信息已更新");
}

export async function lockOddsAction(formData: FormData) {
  await requireAdmin();
  const parsed = oddsSchema.safeParse({
    matchId: formData.get("matchId"),
    home: formData.get("home"),
    draw: formData.get("draw"),
    away: formData.get("away")
  });
  if (!parsed.success) redirectWithToast("/admin", "error", "赔率必须是正数");

  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!match) redirectWithToast("/admin", "error", "比赛不存在");
  if (match.startsAt <= new Date()) redirectWithToast("/admin", "error", "比赛开始后不能修改赔率");

  await prisma.odds.upsert({
    where: { matchId: parsed.data.matchId },
    create: {
      matchId: parsed.data.matchId,
      home: parsed.data.home,
      draw: parsed.data.draw,
      away: parsed.data.away,
      lockedAt: new Date()
    },
    update: {
      home: parsed.data.home,
      draw: parsed.data.draw,
      away: parsed.data.away,
      lockedAt: new Date()
    }
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithToast("/admin", "ok", "赔率已锁定");
}

export async function settleMatchAction(formData: FormData) {
  await requireAdmin();
  const parsed = scoreSchema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore")
  });
  if (!parsed.success) redirectWithToast("/admin", "error", "比分无效");

  try {
    await settleMatch(parsed.data.matchId, parsed.data.homeScore, parsed.data.awayScore);
  } catch (error) {
    redirectWithToast("/admin", "error", error instanceof Error ? error.message : "结算失败");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bets");
  revalidatePath("/leaderboard");
  redirectWithToast("/admin", "ok", "比赛已结算");
}

export async function voidMatchAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) redirectWithToast("/admin", "error", "比赛不存在");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status === MatchStatus.FINISHED) {
    redirectWithToast("/admin", "error", "已结算的比赛不能直接作废");
  }

  await voidMatch(matchId);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/bets");
  revalidatePath("/leaderboard");
  redirectWithToast("/admin", "ok", "比赛已作废并退款");
}
