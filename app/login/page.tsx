import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/app/ui/SubmitButton";
import { Toast } from "@/app/ui/Toast";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="auth-wrap">
      <section className="auth-panel">
        <h1>登录</h1>
        <p>使用账号和密码进入竞猜站。</p>
        <Toast ok={params.ok} error={params.error} />
        <form action={loginAction}>
          <input autoComplete="username" name="username" placeholder="账号" />
          <input autoComplete="current-password" name="password" placeholder="密码" type="password" />
          <SubmitButton pendingText="登录中...">登录</SubmitButton>
        </form>
        <p>
          还没有账号？ <Link href="/register">去注册</Link>
        </p>
      </section>
    </div>
  );
}
