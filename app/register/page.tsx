import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/app/ui/SubmitButton";
import { Toast } from "@/app/ui/Toast";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="auth-wrap">
      <section className="auth-panel">
        <h1>注册</h1>
        <p>新账号会获得 1,000,000 虚拟币。</p>
        <Toast ok={params.ok} error={params.error} />
        <form action={registerAction}>
          <input autoComplete="username" name="username" placeholder="账号" />
          <input autoComplete="new-password" name="password" placeholder="密码，至少 6 位" type="password" />
          <SubmitButton pendingText="创建中...">创建账号</SubmitButton>
        </form>
        <p>
          已有账号？ <Link href="/login">去登录</Link>
        </p>
      </section>
    </div>
  );
}
