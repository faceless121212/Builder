import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Figure.09" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const linkError = params.error === "link";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-10">
        <Logo size={44} />
      </div>
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">Sheet 01 — Sign in</p>
      <h1 className="mt-2 text-4xl leading-[1.05] font-semibold tracking-tight">
        Every idea you want to build, in one drawing.
      </h1>
      <p className="mt-3 text-muted">We&apos;ll email you a sign-in link and a one-time code. No password.</p>
      <LoginForm next={next} linkError={linkError} />
    </main>
  );
}
