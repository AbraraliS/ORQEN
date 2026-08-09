"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/dashboard");
        }}
        className="w-full max-w-sm space-y-4 rounded-md border border-border bg-card p-6"
      >
        <div>
          <h1 className="text-base font-semibold text-foreground">Sign in to Orqen</h1>
          <p className="text-sm text-muted-foreground">
            Authentication is wired to Nhost once the backend is connected.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="maya@northwind.dev" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" defaultValue="demo-password" />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
