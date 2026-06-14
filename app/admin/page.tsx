import { MatchStatus, type Prisma } from "@prisma/client";
import {
  lockOddsAction,
  settleMatchAction,
  updateMatchDetailsAction,
  voidMatchAction
} from "@/app/actions/admin";
import Link from "next/link";
import { SubmitButton } from "@/app/ui/SubmitButton";
import { Toast } from "@/app/ui/Toast";
import { requireAdmin } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatOdds, toDateTimeLocalValue } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ADMIN_STATUS_FILTERS = [
  { label: "全部", value: "ALL", href: "/admin" },
  { label: "未开始", value: "SCHEDULED", href: "/admin?status=SCHEDULED" },
  { label: "进行中", value: "LIVE", href: "/admin?status=LIVE" },
  { label: "已结束", value: "FINISHED", href: "/admin?status=FINISHED" }
] as const;

type AdminStatusFilter = (typeof ADMIN_STATUS_FILTERS)[number]["value"];

function adminStatusFilter(value: string | string[] | undefined): AdminStatusFilter {
  const status = Array.isArray(value) ? value[0] : value;
  return status === "SCHEDULED" || status === "LIVE" || status === "FINISHED" ? status : "ALL";
}

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const selectedStatus = adminStatusFilter(params.status);
  const where: Prisma.MatchWhereInput =
    selectedStatus === "ALL"
      ? {}
      : selectedStatus === "FINISHED"
        ? { status: { in: [MatchStatus.FINISHED, MatchStatus.VOID] } }
        : { status: selectedStatus };
  const matches = await prisma.match.findMany({
    where,
    include: { odds: true },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }]
  });

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>管理后台</h1>
          <p>维护赛程、锁定赔率、录入 90 分钟比分并结算。</p>
        </div>
      </div>
      <Toast ok={params.ok} error={params.error} />
      <section className="filter-bar" aria-label="比赛状态筛选">
        {ADMIN_STATUS_FILTERS.map((filter) => (
          <Link
            className={`filter-chip${selectedStatus === filter.value ? " filter-chip-active" : ""}`}
            href={filter.href}
            key={filter.value}
          >
            {filter.label}
          </Link>
        ))}
      </section>
      <section className="table-panel">
        {matches.map((match) => (
          <article className="admin-match" key={match.id}>
            <div>
              <h3>
                #{match.matchNumber} {match.homeTeam} vs {match.awayTeam}
              </h3>
              <p className="muted">
                {STATUS_LABELS[match.status]} · 当前赔率：主 {formatOdds(match.odds?.home)} / 平{" "}
                {formatOdds(match.odds?.draw)} / 客 {formatOdds(match.odds?.away)}
              </p>
              <form action={updateMatchDetailsAction} className="admin-form">
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="adminStatus" value={selectedStatus} />
                <div className="form-row">
                  <input name="stage" defaultValue={match.stage} placeholder="阶段" />
                  <input name="groupName" defaultValue={match.groupName ?? ""} placeholder="小组，可空" />
                  <input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(match.startsAt)} />
                </div>
                <div className="form-row two">
                  <input name="homeTeam" defaultValue={match.homeTeam} placeholder="主队" />
                  <input name="awayTeam" defaultValue={match.awayTeam} placeholder="客队" />
                </div>
                <SubmitButton className="ghost-button" pendingText="更新中...">
                  更新比赛信息（北京时间）
                </SubmitButton>
              </form>
            </div>
            <form action={lockOddsAction} className="admin-form">
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="adminStatus" value={selectedStatus} />
              <h3>赔率</h3>
              <input
                min="1.01"
                name="home"
                step="0.01"
                type="number"
                defaultValue={match.odds ? formatOdds(match.odds.home) : undefined}
              />
              <input
                min="1.01"
                name="draw"
                step="0.01"
                type="number"
                defaultValue={match.odds ? formatOdds(match.odds.draw) : undefined}
              />
              <input
                min="1.01"
                name="away"
                step="0.01"
                type="number"
                defaultValue={match.odds ? formatOdds(match.odds.away) : undefined}
              />
              <SubmitButton pendingText="锁定中...">锁定赔率</SubmitButton>
            </form>
            <div className="admin-form">
              <form action={settleMatchAction} className="admin-form">
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="adminStatus" value={selectedStatus} />
                <h3>赛果</h3>
                <input min="0" name="homeScore" placeholder="主队 90 分钟进球" type="number" />
                <input min="0" name="awayScore" placeholder="客队 90 分钟进球" type="number" />
                <SubmitButton pendingText="结算中...">结算比赛</SubmitButton>
              </form>
              <form action={voidMatchAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="adminStatus" value={selectedStatus} />
                <SubmitButton className="danger-button" pendingText="退款中...">
                  作废并退款
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
        {matches.length === 0 ? <div className="empty-state">当前筛选下没有比赛。</div> : null}
      </section>
    </>
  );
}
