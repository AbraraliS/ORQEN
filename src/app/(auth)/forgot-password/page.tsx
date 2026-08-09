"use client";

import { useState } from "react";
import Link from "next/link";
import { useResetPassword } from "@nhost/nextjs";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLabel, AuthInput, AuthButton, AuthError } from "@/components/auth/auth-ui";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading, isError, error } = useResetPassword();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    const { error } = await resetPassword(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (!error) {
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    }
  };

  const mapError = (err: any) => {
    if (!err) return undefined;
    return err.message || "An error occurred while sending the reset link.";
  };

  if (isSuccess) {
    return (
      <>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
            <Mail size={24} />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-white/95">Check your inbox</h2>
          <p className="mt-2 text-[15px] text-muted-foreground/90">
            We sent a password reset link to <br />
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login" className="block w-full">
            <AuthButton>Return to sign in</AuthButton>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Forgot password</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Enter your email address and we'll send you a link to reset your password.
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
            autoComplete="email"
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

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading}>
            {isLoading ? "Sending link..." : "Send reset link"}
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 font-medium text-white hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    </>
  );
}
