"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={56}
            height={56}
            className="mx-auto mb-4 rounded-2xl shadow-lg shadow-accent-strong/30"
          />
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 pr-11 text-sm outline-none focus:border-accent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {mode === "sign-up" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 pr-11 text-sm outline-none focus:border-accent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
