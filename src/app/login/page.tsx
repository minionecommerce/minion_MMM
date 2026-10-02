"use client";

import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { landingPath, modulesForPath, snapshotCanViewAny } from "@/lib/rbac/catalog";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_LOCKED: "Too many failed attempts. Your account is locked for 15 minutes.",
  ACCOUNT_INACTIVE: "Your account is not active. Please contact your administrator.",
  TOO_MANY_ATTEMPTS: "Too many sign-in attempts from this network. Please try again later.",
};

// Only same-site relative paths are allowed as a post-login destination
function safeCallback(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\") || raw.startsWith("/login")) return null;
  return raw;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const expired = searchParams.get("expired") === "1";
  const passwordChanged = searchParams.get("passwordChanged") === "1";

  // Clear a revoked/expired session cookie so the next sign-in starts clean
  useEffect(() => {
    if (expired || passwordChanged) signOut({ redirect: false });
  }, [expired, passwordChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    // Stay in the loading state after a successful sign-in: the next page can take a moment to render
    // and re-enabling the button here made people click twice.
    let navigating = false;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        remember: remember ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError(LOGIN_ERROR_MESSAGES[res.error] ?? "Sign-in failed. Please try again.");
        return;
      }

      navigating = true;
      const session = await getSession();
      if (session?.user?.mustChangePassword) {
        router.push("/account/change-password");
      } else {
        const permissions = session?.user?.permissions ?? [];
        const callback = safeCallback(searchParams.get("callbackUrl"));
        const callbackModules = callback ? modulesForPath(callback.split("?")[0]) : null;
        const allowedCallback = callback && (!callbackModules || snapshotCanViewAny(permissions, callbackModules));
        router.push(allowedCallback ? callback : landingPath(permissions));
      }
      router.refresh();
    } catch {
      navigating = false;
      setError("An unexpected error occurred.");
    } finally {
      if (!navigating) setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          MINION CRM
        </h1>
        <p className="text-neutral-400 text-sm tracking-widest uppercase">
          Smart Home Solutions
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-neutral-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-neutral-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-300"
              >
                Email / Username
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-700 rounded-lg shadow-sm bg-neutral-950 placeholder-neutral-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-300"
              >
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-700 rounded-lg shadow-sm bg-neutral-950 placeholder-neutral-500 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-yellow-500 focus:outline-none focus-visible:text-yellow-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-neutral-700 rounded bg-neutral-900"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-neutral-400"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-yellow-500 hover:text-yellow-400"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            {expired && !error && (
              <div className="text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                Your session has ended. Please sign in again.
              </div>
            )}

            {passwordChanged && !error && (
              <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                Password changed. Please sign in with your new password.
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
