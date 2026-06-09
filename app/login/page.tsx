"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = {
  primary: "#8B9E23",
  primaryDark: "#6B7A1A",
  border: "#E5E7EB",
  text: "#1a1a1a",
  muted: "#6B7280",
};

// Jetwing hero: drop the website photo at public/jetwing-hero.jpg to match exactly.
// Until then, the deep-green gradient base below keeps the panel looking intentional.
const HERO_STYLE: React.CSSProperties = {
  backgroundColor: "#1f2a10",
  backgroundImage:
    "linear-gradient(to top, rgba(18,24,8,0.92) 0%, rgba(18,24,8,0.45) 45%, rgba(18,24,8,0.25) 100%), url('/jetwing-hero.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

function Wordmark({ dark = false }: { dark?: boolean }) {
  const color = dark ? C.text : "#ffffff";
  const sub = dark ? C.muted : "rgba(255,255,255,0.7)";
  return (
    <div className="flex flex-col leading-none">
      <span
        className="text-3xl tracking-wide"
        style={{ color, fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Jetwing<span className="font-light"> HOTELS</span>
      </span>
      <span
        className="mt-1.5 text-[10px] font-semibold"
        style={{ color: sub, letterSpacing: "0.42em" }}
      >
        SRI LANKA
      </span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // One-time setup: the very first signed-in user claims the ADMIN role.
  // The endpoint is a safe no-op (403) once any admin exists, so we always
  // try it on a fresh session and ignore the result silently.
  async function claimAdminIfFirst() {
    try {
      await fetch("/api/v1/admin/bootstrap", { method: "POST" });
    } catch {
      /* no-op — an admin already exists, or the network blipped */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      await claimAdminIfFirst();
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        await claimAdminIfFirst();
        router.push("/");
        router.refresh();
      } else {
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Hero panel (Jetwing brand) — left on desktop ─────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-3/5 xl:w-[62%] flex-col justify-between p-12"
        style={HERO_STYLE}
      >
        <Wordmark />

        <div className="max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70 mb-4">
            Sustainable Luxury · Sri Lanka
          </p>
          <h2
            className="text-4xl xl:text-5xl text-white leading-tight"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Analyze Better.
            <br />
            Decide Smarter.
            <br />
            <span style={{ color: "#cdd98f" }}>Operate Greener.</span>
          </h2>
          <p className="mt-5 text-sm text-white/75 leading-relaxed">
            JetMind — the guest-intelligence &amp; revenue platform powering the
            Jetwing Symphony portfolio.
          </p>
        </div>

        <p className="text-[11px] text-white/50">
          © {new Date().getFullYear()} Jetwing Symphony PLC · jetwinghotels.com
        </p>
      </div>

      {/* ── Form panel ───────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-2/5 xl:w-[38%] flex flex-col bg-white">
        {/* Compact hero strip for mobile (where the big panel is hidden). */}
        <div
          className="lg:hidden h-36 flex items-end p-6"
          style={HERO_STYLE}
        >
          <Wordmark />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2.5 mb-7">
              <img
                src="/jetwing-logo.png"
                alt="Jetwing"
                className="w-8 h-8"
              />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: C.primary }}
              >
                JetMind
              </span>
            </div>

            <h1 className="text-2xl font-bold" style={{ color: C.text }}>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm mt-1.5 mb-7" style={{ color: C.muted }}>
              {mode === "signin"
                ? "Sign in to the Jetwing Symphony intelligence platform."
                : "Join the Jetwing Symphony intelligence platform."}
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: C.text }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#8B9E23]/30 focus:border-[#8B9E23] transition-colors"
                  style={{ borderColor: C.border }}
                  placeholder="you@jetwingsymphony.com"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: C.text }}
                >
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[#8B9E23]/30 focus:border-[#8B9E23] transition-colors"
                  style={{ borderColor: C.border }}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#DC2626" }}>
                  {error}
                </p>
              )}
              {info && (
                <p className="text-sm" style={{ color: C.primary }}>
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-95"
                style={{ backgroundColor: C.primary }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setInfo(null);
              }}
              className="w-full text-center text-xs mt-6"
              style={{ color: C.muted }}
            >
              {mode === "signin"
                ? "No account yet? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
