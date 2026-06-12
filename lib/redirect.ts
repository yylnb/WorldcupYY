import { redirect } from "next/navigation";

export function redirectWithToast(path: string, type: "ok" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${path}?${params.toString()}`);
}
