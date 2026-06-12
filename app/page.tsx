import { BetPick } from "@prisma/client";
import { placeBetAction } from "@/app/actions/bets";
import { SubmitButton } from "@/app/ui/SubmitButton";
import { Toast } from "@/app/ui/Toast";
import { getCurrentUser } from "@/lib/auth";
import { PICK_LABELS, STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatOdds } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUser().catch(() => null);
  const matches = await prisma.match.findMany({
    include: { odds: true },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }]
  });
  const now = new Date();

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>2026 世界杯胜平负</h1>
          <p>赛前下注，按 90 分钟含补时结果结算。</p>
        </div>
      </div>
      <Toast ok={params.ok} error={params.error} />
      <section className="grid">
        {matches.map((match) => {
          const canBet = Boolean(user && match.odds && match.status === "SCHEDULED" && match.startsAt > now);
          return (
            <article className="card" key={match.id}>
              <div className="match-meta">
                <span>
                  #{match.matchNumber} · {match.stage}
                  {match.groupName ? ` ${match.groupName}组` : ""}
                </span>
                <span>{STATUS_LABELS[match.status]}</span>
              </div>
              <div className="teams">
                <span>{match.homeTeam}</span>
                <span className="score">
                  {match.homeScore === null || match.awayScore === null
                    ? "vs"
                    : `${match.homeScore} : ${match.awayScore}`}
                </span>
                <span>{match.awayTeam}</span>
              </div>
              <p className="match-time">北京时间 {formatDateTime(match.startsAt)}</p>
              <div className="odds-row">
                <div className="odds-pill">主胜 {formatOdds(match.odds?.home)}</div>
                <div className="odds-pill">平局 {formatOdds(match.odds?.draw)}</div>
                <div className="odds-pill">客胜 {formatOdds(match.odds?.away)}</div>
              </div>
              {canBet ? (
                <form action={placeBetAction} className="bet-row">
                  <input type="hidden" name="matchId" value={match.id} />
                  <select name="pick" aria-label="选择结果">
                    {Object.values(BetPick).map((pick) => (
                      <option key={pick} value={pick}>
                        {PICK_LABELS[pick]}
                      </option>
                    ))}
                  </select>
                  <input min="1" name="stake" placeholder="下注金额" type="number" />
                  <SubmitButton pendingText="下注中...">下注</SubmitButton>
                </form>
              ) : (
                <p className="muted">{user ? "当前不可下注" : "登录后可下注"}</p>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}
