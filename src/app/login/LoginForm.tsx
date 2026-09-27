"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "sent";

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? "That sign-in link is invalid or expired. Request a new one, or use the code." : null,
  );

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return setError("Enter a valid email address.");
    setBusy(true);
    const supabase = createClient();
    const redirect = new URL("/auth/callback", window.location.origin);
    redirect.searchParams.set("next", next);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirect.toString(), shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("sent");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = code.replace(/\s/g, "");
    if (!/^\d{6,10}$/.test(token)) return setError("Enter the code from the email.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  const input =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink shadow-card outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25";
  const button =
    "h-12 w-full rounded-xl bg-ink font-medium text-paper transition active:scale-[0.99] disabled:opacity-60";

  return (
    <div className="mt-8">
      {step === "email" ? (
        <form onSubmit={sendLink} className="space-y-3" noValidate>
          <label className="block">
            <span className="mb-1.5 block font-mono text-xs tracking-widest text-muted uppercase">Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={input}
            />
          </label>
          <button disabled={busy} className={button}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3" noValidate>
          <div className="rounded-xl border border-dashed border-line bg-surface/70 p-4 text-sm">
            Check <strong>{email.trim()}</strong>. Tap the link in the email, or type the code here —
            the code is best on an installed app (iPhone).
          </div>
          <label className="block">
            <span className="mb-1.5 block font-mono text-xs tracking-widest text-muted uppercase">Code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`${input} font-mono tracking-[0.3em]`}
            />
          </label>
          <button disabled={busy} className={button}>
            {busy ? "Checking…" : "Sign in with code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="h-11 w-full text-sm text-muted underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
