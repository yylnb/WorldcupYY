import type { Metadata } from "next";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/app/ui/SubmitButton";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorldcupYY 世界杯竞猜",
  description: "朋友之间娱乐用的 2026 世界杯胜平负竞猜站"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="topbar">
          <Link className="brand" href="/">
            WorldcupYY
          </Link>
          <nav className="nav">
            <Link href="/">比赛</Link>
            <Link href="/bets">我的下注</Link>
            <Link href="/leaderboard">排行榜</Link>
            {user?.role === "ADMIN" ? <Link href="/admin">管理后台</Link> : null}
          </nav>
          <div className="account">
            {user ? (
              <>
                <span className="account-badge">
                  <strong>{user.username}</strong>
                  <span>{formatMoney(user.balance)} 币</span>
                </span>
                <form action={logoutAction}>
                  <SubmitButton className="ghost-button" pendingText="退出中...">
                    退出
                  </SubmitButton>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">登录</Link>
                <Link className="primary-link" href="/register">
                  注册
                </Link>
              </>
            )}
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
