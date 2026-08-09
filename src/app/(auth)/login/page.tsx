"use client";

import { useState, useRef } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const { signInEmailPassword, isLoading, isError, error } = useSignInEmailPassword();

  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const { isSuccess } = await signInEmailPassword(data.email, data.password);

    if (isSuccess) {
      router.push("/dashboard");
    }
  };

  const mapError = (err: any) => {
    if (!err) return undefined;
    const msg = err.message || "";
    if (msg.includes("Invalid email") || msg.includes("invalid-credentials")) {
      return "Invalid email or password.";
    }
    return msg;
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Welcome back</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Sign in to your Orqen workspace.
        </p>
      </div>

      <AuthError message={isError ? mapError(error) : undefined} />

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
