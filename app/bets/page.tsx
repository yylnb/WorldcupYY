import { requireUser } from "@/lib/auth";
import { BET_STATUS_LABELS, PICK_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney, formatOdds } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
  const user = await requireUser();
  const bets = await prisma.bet.findMany({
    where: { userId: user.id },
    include: { match: true },
    orderBy: { createdAt: "desc" }
  });
  const activeBets = bets.filter((bet) => bet.status === "PENDING").length;
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0n);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>我的下注</h1>
          <p>查看下注状态、锁定赔率和结算结果。</p>
        </div>
      </div>
      <section className="summary-grid">
        <div className="summary-card">
          <span>下注单数</span>
          <strong>{bets.length}</strong>
        </div>
        <div className="summary-card">
          <span>待结算</span>
          <strong>{activeBets}</strong>
        </div>
        <div className="summary-card">
          <span>累计本金</span>
          <strong>{formatMoney(totalStake)}</strong>
        </div>
      </section>
      <section className="table-panel">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>比赛</th>
              <th>选择</th>
              <th>本金</th>
              <th>赔率</th>
              <th>状态</th>
              <th>收益</th>
              <th>下注时间（北京时间）</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => (
              <tr key={bet.id}>
                <td>
                  #{bet.match.matchNumber} {bet.match.homeTeam} vs {bet.match.awayTeam}
                </td>
                <td>{PICK_LABELS[bet.pick]}</td>
                <td>{formatMoney(bet.stake)}</td>
                <td>{formatOdds(bet.oddsAtBet)}</td>
                <td>{BET_STATUS_LABELS[bet.status]}</td>
                <td>{bet.payout === null ? "-" : formatMoney(bet.payout)}</td>
                <td>{formatDateTime(bet.createdAt)}</td>
              </tr>
            ))}
            {bets.length === 0 ? (
              <tr>
                <td colSpan={7}>还没有下注。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="mobile-list">
          {bets.map((bet) => (
            <article className="info-card" key={bet.id}>
              <div className="info-card-head">
                <strong>
                  #{bet.match.matchNumber} {bet.match.homeTeam} vs {bet.match.awayTeam}
                </strong>
                <span className={`status-chip status-${bet.status.toLowerCase()}`}>{BET_STATUS_LABELS[bet.status]}</span>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>选择</dt>
                  <dd>{PICK_LABELS[bet.pick]}</dd>
                </div>
                <div>
                  <dt>本金</dt>
                  <dd>{formatMoney(bet.stake)}</dd>
                </div>
                <div>
                  <dt>赔率</dt>
                  <dd>{formatOdds(bet.oddsAtBet)}</dd>
                </div>
                <div>
                  <dt>收益</dt>
                  <dd>{bet.payout === null ? "-" : formatMoney(bet.payout)}</dd>
                </div>
              </dl>
              <p className="mobile-time">北京时间 {formatDateTime(bet.createdAt)}</p>
            </article>
          ))}
          {bets.length === 0 ? <div className="empty-state">还没有下注。</div> : null}
        </div>
      </section>
    </>
  );
}
