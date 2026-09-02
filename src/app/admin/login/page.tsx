"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (res.ok && j.ok) {
        router.replace(next.startsWith("/admin") ? next : "/admin");
        router.refresh();
      } else if (res.status === 503) {
        setErr(j.message || "Admin login isn't configured yet.");
      } else {
        setErr("That password didn't match. Try again.");
      }
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-[380px] flex flex-col gap-5 rounded-3xl border border-cream/12 bg-ink p-8"
        style={{ boxShadow: "0 40px 80px -50px rgba(0,0,0,0.9)" }}
      >
        <div className="flex flex-col gap-2">
          <span className="font-display font-extrabold text-[24px] tracking-[-0.04em] leading-none">
            brandit<span className="text-mango">bro</span><span className="text-chili">.</span>
          </span>
          <span className="text-[13px] text-cream/50 font-bold tracking-[0.18em] uppercase">Admin</span>
        </div>
        <label className="flex flex-col gap-2 text-[13px] font-bold text-cream/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="h-12 rounded-xl border border-cream/15 bg-ink-deep px-4 text-[15px] text-cream outline-none focus:border-mango"
          />
        </label>
        {err && <p className="m-0 text-[13px] text-chili">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-full bg-mango text-ink font-bold text-[15px] border-0 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <LoginForm />
    </Suspense>
  );
}
