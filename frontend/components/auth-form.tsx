"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const demoAccounts = [
  { label: "Commuter tester", email: "tester@boardwise.hyderabad", password: "tester123", description: "Use the live commuter experience", icon: UserRound },
  { label: "Admin judge", email: "admin@boardwise.hyderabad", password: "admin123", description: "Unlock the command center", icon: ShieldCheck },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) await register(email, password);
      else await login(email, password);
      router.replace("/simulate");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to authenticate. Please try again.");
    } finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="glass-card mt-8 p-6 sm:p-8">
    {!isSignup && <DemoAccess onFill={(account) => { setEmail(account.email); setPassword(account.password); setError(""); }} />}
    <label htmlFor="email" className="text-sm font-semibold">Email address</label>
    <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400" placeholder="you@example.com" />
    <label htmlFor="password" className="mt-5 block text-sm font-semibold">Password</label>
    <input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400" placeholder="At least 8 characters" />
    {isSignup && <p className="mt-2 text-xs text-slate-500">New accounts are commuter accounts. Admin access is assigned by the system.</p>}
    {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}
    <button className="button button-primary mt-6 w-full" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={17} /> : null}{isSignup ? "Create account" : "Sign in"}</button>
    <p className="mt-5 text-center text-sm text-slate-400">{isSignup ? "Already have an account?" : "Need an account?"} <Link className="font-semibold text-emerald-300 hover:text-emerald-200" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create one"}</Link></p>
  </form>;
}

function DemoAccess({ onFill }: { onFill: (account: typeof demoAccounts[number]) => void }) {
  return <section className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
    <p className="text-sm font-bold text-emerald-200">Judge quick access</p>
    <p className="mt-1 text-xs leading-5 text-slate-400">Choose a role to autofill its deterministic demo credentials, then press Sign in.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{demoAccounts.map((account) => { const Icon = account.icon; return <button key={account.email} type="button" onClick={() => onFill(account)} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-left transition hover:border-emerald-400 hover:bg-slate-800"><span className="flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-emerald-300" />{account.label}</span><span className="mt-1 block text-xs text-slate-400">{account.description}</span></button>; })}</div>
  </section>;
}
