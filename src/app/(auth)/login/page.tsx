"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, ShieldCheck, LineChart, Bot, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@convoinsight.ai");
  const [password, setPassword] = useState("Passw0rd!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-background to-violet-100 px-4 dark:from-slate-950 dark:via-background dark:to-indigo-950">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/20" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card/70 shadow-xl backdrop-blur-sm lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white lg:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">ConvoInsight AI</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold leading-snug">
              The control plane for your fleet of AI assistants.
            </h2>
            <ul className="space-y-4 text-sm text-white/90">
              <li className="flex items-center gap-3">
                <Bot className="h-5 w-5 shrink-0" />
                Monitor & manage every AI assistant in one place
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Evaluate, govern, and catch hallucinations automatically
              </li>
              <li className="flex items-center gap-3">
                <LineChart className="h-5 w-5 shrink-0" />
                A/B test prompts and track quality over time
              </li>
            </ul>
          </div>

          <p className="text-xs text-white/70">Enterprise AI Conversation Studio</p>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1 text-center lg:hidden">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="pt-2 text-xl font-semibold">ConvoInsight AI</h1>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to the admin console.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <Card className="border-dashed bg-muted/40">
              <CardContent className="space-y-1 p-3 text-xs">
                <p className="font-medium text-muted-foreground">Demo accounts · password Passw0rd!</p>
                <div className="grid gap-0.5 text-muted-foreground">
                  <span>admin@convoinsight.ai · full access</span>
                  <span>reviewer@convoinsight.ai · evaluate & test</span>
                  <span>analyst@convoinsight.ai · read-only</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
