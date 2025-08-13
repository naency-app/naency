import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getServerSession() {
  const h = new Headers(Object.fromEntries((await headers()).entries()));

  const result = await auth.api.getSession({
    headers: h,
  });

  return result?.session ? result : null;
}
