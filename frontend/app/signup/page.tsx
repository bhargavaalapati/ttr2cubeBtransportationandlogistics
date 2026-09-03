import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
export default function SignupPage() { return <main className="min-h-screen bg-slate-950 text-slate-50"><SiteHeader /><section className="mx-auto max-w-md px-5 py-16"><p className="eyebrow">Get started</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Create your account</h1><p className="mt-3 text-slate-400">Share transit signals and make better boarding decisions.</p><AuthForm mode="signup" /></section></main>; }
