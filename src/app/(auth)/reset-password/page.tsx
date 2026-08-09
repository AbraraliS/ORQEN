"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChangePassword, useAuthenticationStatus } from "@nhost/nextjs";
import { Eye, EyeOff, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLabel, AuthInput, AuthButton, AuthError } from "@/components/auth/auth-ui";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthenticationStatus();
  const { changePassword, isLoading, isError, error } = useChangePassword();

  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Auto-redirect to dashboard when success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            router.push("/dashboard");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, router]);

  const onSubmit = async (data: ResetFormValues) => {
    const { error: changeErr } = await changePassword(data.password);
    if (!changeErr) {
      setIsSuccess(true);
    }
  };

  const mapError = (err: any) => {
    if (!err) return undefined;
    const msg = err.message || "";
    if (msg.includes("jwt")) return "Password reset link is invalid or has expired.";
    return msg;
  };

  if (isAuthLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Must be authenticated via the token in URL before changing password
  if (!isAuthenticated && !isSuccess) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">Invalid or Expired Link</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <AuthButton onClick={() => router.push("/forgot-password")}>Request new link</AuthButton>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Password reset</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Your password has been successfully updated.
          <br />
          Redirecting to dashboard in {countdown}s...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Set new password</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Please enter your new password below.
        </p>
      </div>

      <AuthError message={isError ? mapError(error) : undefined} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <AuthLabel htmlFor="password">New password</AuthLabel>
          <AuthInput
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="new-password"
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

        <div>
          <AuthLabel htmlFor="confirmPassword">Confirm new password</AuthLabel>
          <AuthInput
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            prefixIcon={<KeyRound size={16} />}
            {...register("confirmPassword")}
            className={
              errors.confirmPassword
                ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20"
                : ""
            }
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-[0.8rem] text-destructive font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading}>
            {isLoading ? "Resetting..." : "Reset password"}
          </AuthButton>
        </div>
      </form>
    </>
  );
}
