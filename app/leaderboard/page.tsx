import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      balance: true,
      role: true
    },
    orderBy: [{ balance: "desc" }, { createdAt: "asc" }]
  });
  const topThree = users.slice(0, 3);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>总排行榜</h1>
          <p>按当前个人资产排序。</p>
        </div>
      </div>
      {topThree.length > 0 ? (
        <section className="podium">
          {topThree.map((user, index) => (
            <article className={`podium-card rank-${index + 1}`} key={user.id}>
              <span>#{index + 1}</span>
              <strong>{user.username}</strong>
              <p>{formatMoney(user.balance)} 币</p>
            </article>
          ))}
        </section>
      ) : null}
      <section className="table-panel">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>账号</th>
              <th>角色</th>
              <th>资产</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.role === "ADMIN" ? "管理员" : "玩家"}</td>
                <td>{formatMoney(user.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mobile-list">
          {users.map((user, index) => (
            <article className="info-card leaderboard-card" key={user.id}>
              <div className="rank-badge">{index + 1}</div>
              <div>
                <strong>{user.username}</strong>
                <p>{user.role === "ADMIN" ? "管理员" : "玩家"}</p>
              </div>
              <span>{formatMoney(user.balance)} 币</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
