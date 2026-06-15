import { BetPick, MatchStatus } from "@prisma/client";
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
    where: {
      status: {
        notIn: [MatchStatus.FINISHED, MatchStatus.VOID]
      }
    },
    include: { odds: true },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }]
  });
  const now = new Date();
  const highlightedMatchId = matches.find(
    (match) => match.odds && match.status === MatchStatus.SCHEDULED && match.startsAt > now
  )?.id;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>2026 世界杯胜平负</h1>
          <p>赛前下注，按 90 分钟含补时结果结算。</p>
        </div>
      </div>
      <div className="home-note">
        说明：每张比赛卡片左边球队是主队，右边球队是客队；主胜=左边主队赢，客胜=右边客队赢，平局=90
        分钟含补时打平。
      </div>
      <Toast ok={params.ok} error={params.error} />
      <section className="grid">
        {matches.map((match) => {
          const isOpenForBet = Boolean(
            match.odds && match.status === MatchStatus.SCHEDULED && match.startsAt > now
          );
          const canBet = Boolean(user && isOpenForBet);
          const isHighlighted = match.id === highlightedMatchId;
          return (
            <article className={`card${isHighlighted ? " card-highlight" : ""}`} key={match.id}>
              {isHighlighted ? <span className="highlight-badge">下一场可下注</span> : null}
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
        {matches.length === 0 ? <div className="empty-state">暂无可展示的比赛，请到历史比赛查看记录。</div> : null}
      </section>
    </>
  );
}
