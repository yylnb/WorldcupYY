import { BetPick, BetStatus, LedgerType, MatchStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export function decimalToCents(decimal: Prisma.Decimal) {
  const [whole, fraction = ""] = decimal.toString().split(".");
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

export function payoutFor(stake: bigint, odds: Prisma.Decimal) {
  return (stake * decimalToCents(odds)) / 100n;
}

export function winningPick(homeScore: number, awayScore: number): BetPick {
  if (homeScore > awayScore) return BetPick.HOME;
  if (homeScore < awayScore) return BetPick.AWAY;
  return BetPick.DRAW;
}

export async function placeBet(userId: string, matchId: string, pick: BetPick, stake: bigint) {
  if (stake <= 0n) {
    throw new Error("下注金额必须大于 0");
  }

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { odds: true }
    });

    if (!match) throw new Error("比赛不存在");
    if (match.status !== MatchStatus.SCHEDULED || match.startsAt <= new Date()) {
      throw new Error("这场比赛已经停止下注");
    }
    if (!match.odds) throw new Error("管理员还没有锁定这场比赛的赔率");

    const oddsAtBet =
      pick === BetPick.HOME ? match.odds.home : pick === BetPick.DRAW ? match.odds.draw : match.odds.away;

    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        balance: { gte: stake }
      },
      data: {
        balance: { decrement: stake }
      }
    });

    if (updated.count !== 1) throw new Error("余额不足");

    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const bet = await tx.bet.create({
      data: {
        userId,
        matchId,
        pick,
        stake,
        oddsAtBet
      }
    });

    await tx.ledgerEntry.create({
      data: {
        userId,
        betId: bet.id,
        type: LedgerType.BET_STAKE,
        amount: -stake,
        balance: user.balance,
        note: `下注比赛 #${match.matchNumber}`
      }
    });

    return bet;
  });
}

export async function settleMatch(matchId: string, homeScore: number, awayScore: number) {
  if (homeScore < 0 || awayScore < 0) {
    throw new Error("比分不能为负数");
  }

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status: MatchStatus.FINISHED
      }
    });

    const winner = winningPick(homeScore, awayScore);
    const pendingBets = await tx.bet.findMany({
      where: { matchId, status: BetStatus.PENDING }
    });

    for (const bet of pendingBets) {
      if (bet.pick === winner) {
        const payout = payoutFor(bet.stake, bet.oddsAtBet);
        const user = await tx.user.update({
          where: { id: bet.userId },
          data: { balance: { increment: payout } }
        });
        await tx.bet.update({
          where: { id: bet.id },
          data: { status: BetStatus.WON, payout }
        });
        await tx.ledgerEntry.create({
          data: {
            userId: bet.userId,
            betId: bet.id,
            type: LedgerType.BET_PAYOUT,
            amount: payout,
            balance: user.balance,
            note: `比赛 #${match.matchNumber} 中奖`
          }
        });
      } else {
        await tx.bet.update({
          where: { id: bet.id },
          data: { status: BetStatus.LOST, payout: 0n }
        });
      }
    }

    return match;
  });
}

export async function voidMatch(matchId: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.VOID }
    });

    const pendingBets = await tx.bet.findMany({
      where: { matchId, status: BetStatus.PENDING }
    });

    for (const bet of pendingBets) {
      const user = await tx.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: bet.stake } }
      });
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: BetStatus.REFUNDED, payout: bet.stake }
      });
      await tx.ledgerEntry.create({
        data: {
          userId: bet.userId,
          betId: bet.id,
          type: LedgerType.BET_REFUND,
          amount: bet.stake,
          balance: user.balance,
          note: `比赛 #${match.matchNumber} 作废退款`
        }
      });
    }

    return match;
  });
}
