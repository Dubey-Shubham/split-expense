"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Wallet, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { loginAction } from "@/app/actions/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Pre-fill email if they just signed up
  useEffect(() => {
    try {
      const lastEmail = localStorage.getItem("split_expense_last_registered_email");
      if (lastEmail) {
        // Defer to avoid render race warnings
        setTimeout(() => {
          setValue("email", lastEmail);
        }, 0);
        localStorage.removeItem("split_expense_last_registered_email"); // Clean up
      }
    } catch (err) {
      console.error(err);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const res = await loginAction({
        email: data.email,
        password: data.password,
      });

      if (!res.success) {
        setError("root", { message: res.error || "Invalid email address or password" });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);

      // Redirect to main layout page
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("root", { message: "An error occurred during verification. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-background overflow-hidden py-8 md:py-16">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 z-10 flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-md space-y-6">
          {/* Back Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Logo and Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl ring-1 ring-primary/50">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Log in to manage your budget and split expenses with friends
            </p>
          </div>

          {/* Login Card container */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Login Successful!</h3>
                  <p className="text-sm text-muted-foreground">Heading to your dashboard...</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{errors.root.message}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="hardik@example.com"
                      {...register("email")}
                      className={`w-full bg-background border text-foreground rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${errors.email
                        ? "border-destructive focus:ring-1 focus:ring-destructive"
                        : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                        }`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center gap-4">
                    <label className="text-sm font-semibold text-foreground">Password</label>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className={`w-full bg-background border text-foreground rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none transition-all ${errors.password
                        ? "border-destructive focus:ring-1 focus:ring-destructive"
                        : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="font-semibold text-foreground hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
