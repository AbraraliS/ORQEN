"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignInEmailPassword } from "@nhost/nextjs";
import { Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLabel, AuthInput, AuthButton, AuthError } from "@/components/auth/auth-ui";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Maps Nhost error codes/messages to user-friendly strings
function mapNhostError(err: unknown): string {
  if (!err) return "Sign in failed. Please try again.";
  const e = err as { error?: string; message?: string; status?: number };
  const code = e.error ?? "";
  const msg = e.message ?? "";

  if (code === "invalid-email-password" || code === "invalid-credentials" || code === "invalid-ticket") {
    return "Invalid email or password. Please try again.";
  }
  if (code === "unverified-user" || msg.toLowerCase().includes("not verified")) {
    return "Your email isn't verified yet. Please check your inbox for a verification link.";
  }
  if (code === "user-not-found") {
    return "No account found with this email address.";
  }
  if (code === "disabled-user") {
    return "This account has been disabled. Please contact support.";
  }
  if (code === "too-many-requests") {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }
  return msg || "Sign in failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { signInEmailPassword, isLoading } = useSignInEmailPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(undefined);
    try {
      const result = await signInEmailPassword(data.email, data.password);
      if (result.isSuccess) {
        router.push("/dashboard");
        return;
      }
      // SDK sets isError but we read error from result directly
      setFormError(mapNhostError(result.error));
    } catch (err: unknown) {
      setFormError(mapNhostError(err));
    }
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Welcome back</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Sign in to your Orqen workspace.
        </p>
      </div>

      <AuthError message={formError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <AuthLabel htmlFor="email">Email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="username"
            disabled={isLoading}
            prefixIcon={<Mail size={16} />}
            {...register("email")}
            className={
              errors.email
                ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20"
                : ""
            }
          />
          {errors.email && (
            <p className="mt-1.5 text-[0.8rem] text-destructive font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <AuthInput
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            prefixIcon={<KeyRound size={16} />}
            {...register("password")}
            className={
              errors.password
                ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20"
                : ""
            }
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-sm p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {errors.password && (
            <p className="mt-1.5 text-[0.8rem] text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-white hover:text-primary transition-colors"
        >
          Create account
        </Link>
      </div>
    </>
  );
}
