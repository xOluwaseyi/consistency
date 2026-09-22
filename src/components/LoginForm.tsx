"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/today");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setMessage("Account created. Check your email to confirm, then sign in.");
    setMode("sign-in");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-linear-to-br from-[#818cf8] to-[#4338ca] shadow-lg shadow-accent-strong/30" />
          <h1 className="text-2xl font-semibold tracking-tight">Consistency</h1>
          <p className="mt-1 text-sm text-muted">Plan the day. Protect the streak.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-black/20"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-accent"
                placeholder="••••••••"
              />
            </div>
            {mode === "sign-up" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm outline-none focus:border-accent"
                  placeholder="••••••••"
                />
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          {message && <p className="mt-3 text-sm text-success">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-linear-to-br from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-strong/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
              setMessage(null);
              setConfirmPassword("");
            }}
            className="mt-4 w-full text-center text-xs text-muted hover:text-foreground"
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
