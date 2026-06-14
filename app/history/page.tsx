import { MatchStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatOdds } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const matches = await prisma.match.findMany({
    where: {
      status: {
        in: [MatchStatus.FINISHED, MatchStatus.VOID]
      }
    },
    include: { odds: true },
    orderBy: [{ startsAt: "desc" }, { matchNumber: "desc" }]
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>历史比赛</h1>
          <p>查看已结束和作废比赛的比分、状态与赔率记录。</p>
        </div>
      </div>
      <section className="grid">
        {matches.map((match) => (
          <article className="card history-card" key={match.id}>
            <div className="match-meta">
              <span>
                #{match.matchNumber} · {match.stage}
                {match.groupName ? ` ${match.groupName}组` : ""}
              </span>
              <span className={`status-chip status-${match.status.toLowerCase()}`}>
                {STATUS_LABELS[match.status]}
              </span>
            </div>
            <div className="teams">
              <span>{match.homeTeam}</span>
              <span className="score">
                {match.homeScore === null || match.awayScore === null ? "-" : `${match.homeScore} : ${match.awayScore}`}
              </span>
              <span>{match.awayTeam}</span>
            </div>
            <p className="match-time">北京时间 {formatDateTime(match.startsAt)}</p>
            <div className="odds-row">
              <div className="odds-pill">主胜 {formatOdds(match.odds?.home)}</div>
              <div className="odds-pill">平局 {formatOdds(match.odds?.draw)}</div>
              <div className="odds-pill">客胜 {formatOdds(match.odds?.away)}</div>
            </div>
          </article>
        ))}
        {matches.length === 0 ? <div className="empty-state">还没有已结束或作废的比赛。</div> : null}
      </section>
    </>
  );
}
