import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faKey,
  faRightToBracket,
  faSpinner,
  faTriangleExclamation,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type { FormEvent, ReactNode } from "react";
import { auth } from "../firebase/client";
import { useAuthState } from "../hooks/useAuthState";
import { useCachedCollections } from "../hooks/useCachedCollections";
import Dashboard from "./Dashboard";
import WorkspaceBootstrap from "./WorkspaceBootstrap";

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
const primaryButtonClasses =
  "cursor-pointer inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:opacity-60";
const subtleButtonClasses =
  "cursor-pointer inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition";

const bannerToneClasses = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
} as const;

const bannerToneIcons: Record<keyof typeof bannerToneClasses, IconDefinition> =
  {
    info: faCircleInfo,
    success: faCircleCheck,
    danger: faCircleExclamation,
    warning: faTriangleExclamation,
  };

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  invitationCode: "",
};

const AuthGate = () => {
  const { user, cachedUser, initializing, error, cacheReady } = useAuthState();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inviteCode = import.meta.env.VITE_INVITE_CODE?.trim();

  const missingInviteCode = useMemo(
    () => mode === "register" && !inviteCode,
    [inviteCode, mode],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to sign in right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!inviteCode) {
      setFormError("Registration is disabled until an invitation code is set.");
      return;
    }
    if (form.invitationCode.trim() !== inviteCode) {
      setFormError("Invalid invitation code.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Use a password with at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to register right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setForm(initialForm);
    setFormError(null);
  };

  const workspaceUser = user ?? cachedUser ?? null;
  const isColdStart = initializing && !workspaceUser;
  const { cachedCollections } = useCachedCollections(
    workspaceUser?.uid ?? null,
    cacheReady,
  );

  if (isColdStart) {
    return <WorkspaceBootstrap />;
  }

  if (workspaceUser) {
    return (
      <Dashboard
        key={workspaceUser.uid}
        user={workspaceUser}
        allowSync={Boolean(user)}
        initialCollections={cachedCollections}
      />
    );
  }

  const onSubmit = mode === "login" ? handleLogin : handleRegister;

  const Banner = ({
    tone,
    children,
  }: {
    tone: keyof typeof bannerToneClasses;
    children: ReactNode;
  }) => (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${bannerToneClasses[tone]}`}
    >
      <FontAwesomeIcon icon={bannerToneIcons[tone]} className="text-base" />
      <span>{children}</span>
    </div>
  );

  const actionIcon = submitting
    ? faSpinner
    : mode === "login"
      ? faRightToBracket
      : faUserPlus;

  return (
    <div className="w-full max-w-3xl mx-auto mt-60 rounded-3xl bg-white/90 p-6 shadow-2xl ring-1 ring-slate-100 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Tabby collections
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to sync your Toby-style workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Everything is stored securely in Firebase, so every browser sees the
            same collections, folders, and bookmarks.
          </p>
        </div>
        {error && <Banner tone="warning">{error.message}</Banner>}
        {formError && <Banner tone="danger">{formError}</Banner>}
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email address
            <input
              required
              name="email"
              autoComplete="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={inputClasses}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              required
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className={inputClasses}
            />
          </label>
          {mode === "register" && (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Confirm password
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={inputClasses}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Invitation code
                <input
                  required
                  name="invitationCode"
                  type="text"
                  placeholder="Your invite-only code"
                  value={form.invitationCode}
                  onChange={handleChange}
                  disabled={missingInviteCode}
                  className={`${inputClasses} ${
                    missingInviteCode ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />
              </label>
              {missingInviteCode && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <FontAwesomeIcon icon={faKey} className="text-slate-400" />
                  Set{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
                    VITE_INVITE_CODE
                  </code>{" "}
                  in your environment to enable registration.
                </p>
              )}
            </>
          )}
          <button
            type="submit"
            disabled={submitting || missingInviteCode}
            className={primaryButtonClasses}
          >
            <FontAwesomeIcon
              icon={actionIcon}
              spin={submitting}
              className="mr-2"
            />
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <button
          className={subtleButtonClasses}
          onClick={toggleMode}
          type="button"
        >
          {mode === "login"
            ? "Need access? Use an invite to register."
            : "Already have an account? Sign in."}
        </button>
      </div>
    </div>
  );
};

export default AuthGate;
