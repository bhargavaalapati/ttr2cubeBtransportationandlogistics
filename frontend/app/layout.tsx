import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
export const metadata: Metadata = { title: "BoardWise | Transit decision intelligence", description: "Know whether you can board your bus, and what to do when you cannot." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AuthProvider><RouteGuard>{children}</RouteGuard></AuthProvider></body></html>; }
