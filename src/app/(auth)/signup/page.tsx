"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUpEmailPassword } from "@nhost/nextjs";
import { Eye, EyeOff, CheckCircle2, Mail, KeyRound, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLabel, AuthInput, AuthButton, AuthError } from "@/components/auth/auth-ui";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUpEmailPassword, isLoading, isError, error, isSuccess } = useSignUpEmailPassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    await signUpEmailPassword(data.email, data.password, {
      displayName: data.fullName,
      metadata: {
        fullName: data.fullName,
      },
    });
  };

  const mapError = (err: any) => {
    if (!err) return undefined;
    const msg = err.message || "";
    if (msg.includes("already exists")) {
      return "An account with this email already exists.";
    }
    return msg;
  };

  if (isSuccess) {
    return (
      <>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Check your email</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We've sent a verification link to your email address.
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
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">Create your account</h2>
        <p className="mt-2 text-[15px] text-muted-foreground/90">
          Start building executable AI workflows.
        </p>
      </div>

      <AuthError message={isError ? mapError(error) : undefined} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <AuthLabel htmlFor="fullName">Full name</AuthLabel>
          <AuthInput
            id="fullName"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={isLoading}
            prefixIcon={<User size={16} />}
            {...register("fullName")}
            className={
              errors.fullName
                ? "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/20"
                : ""
            }
          />
          {errors.fullName && (
            <p className="mt-1.5 text-[0.8rem] text-destructive font-medium">
              {errors.fullName.message}
            </p>
          )}
        </div>

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

        <div>
          <AuthLabel htmlFor="password">Password</AuthLabel>
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
          <AuthLabel htmlFor="confirmPassword">Confirm password</AuthLabel>
          <AuthInput
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
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
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="rounded-sm p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
            {isLoading ? "Creating account..." : "Create account"}
          </AuthButton>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-white hover:text-primary transition-colors">
          Sign in
        </Link>
      </div>
    </>
  );
}
