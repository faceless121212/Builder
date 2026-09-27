import { redirect } from "next/navigation";
import { IdeasApp } from "@/components/IdeasApp";
import type { Idea } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("ideas").select("*").order("created_at", { ascending: false });

  return <IdeasApp initialIdeas={(data ?? []) as Idea[]} userId={user.id} email={user.email ?? ""} />;
}
