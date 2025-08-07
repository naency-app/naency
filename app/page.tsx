import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  const { data: session } = await authClient.getSession()
  console.log(session)
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
