import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
export default function LoginPage() { return <main className="min-h-screen bg-slate-950 text-slate-50"><SiteHeader /><section className="mx-auto max-w-md px-5 py-16"><p className="eyebrow">Welcome back</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Sign in to BoardWise</h1><p className="mt-3 text-slate-400">Use your commuter or admin account to continue.</p><AuthForm mode="login" /></section></main>; }
