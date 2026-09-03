"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const publicPaths = new Set(["/login", "/signup"]);

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = publicPaths.has(pathname);

  useEffect(() => {
    if (isReady && !user && !isPublicPath) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isPublicPath, isReady, pathname, router, user]);

  if (!isReady || (!user && !isPublicPath)) return <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-400"><p className="text-sm">Checking your BoardWise session...</p></main>;
  return <>{children}</>;
}
