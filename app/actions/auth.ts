"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { INITIAL_BALANCE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { redirectWithToast } from "@/lib/redirect";

const credentialsSchema = z.object({
  username: z.string().trim().min(2, "账号至少 2 个字符").max(32, "账号不能超过 32 个字符"),
  password: z.string().min(6, "密码至少 6 个字符").max(128, "密码不能超过 128 个字符")
});

export async function registerAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    redirectWithToast("/register", "error", parsed.error.issues[0]?.message ?? "注册信息无效");
  }

  const { username, password } = parsed.data;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          passwordHash: await hashPassword(password),
          balance: INITIAL_BALANCE
        }
      });
      await tx.ledgerEntry.create({
        data: {
          userId: created.id,
          type: "INITIAL_GRANT",
          amount: INITIAL_BALANCE,
          balance: INITIAL_BALANCE,
          note: "新用户初始虚拟币"
        }
      });
      return created;
    });

    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithToast("/register", "error", "这个账号已经被注册");
    }
    throw error;
  }

  redirect("/");
}

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    redirectWithToast("/login", "error", parsed.error.issues[0]?.message ?? "登录信息无效");
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirectWithToast("/login", "error", "账号或密码错误");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
