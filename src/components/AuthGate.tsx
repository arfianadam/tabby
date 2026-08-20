import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCat,
  faCloudArrowUp,
  faKey,
  faLayerGroup,
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
import { auth } from "@/firebase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { useCachedCollections } from "@/hooks/useCachedCollections";
import Dashboard from "@/features/dashboard";
import WorkspaceBootstrap from "@/components/WorkspaceBootstrap";

const inputClasses =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClasses =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(240,100,69,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";
const subtleButtonClasses =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]";

const bannerToneClasses = {
  info: "border-sky-500/20 bg-sky-500/8 text-sky-700 dark:text-sky-300",
  success:
    "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300",
  danger: "border-rose-500/20 bg-rose-500/8 text-rose-700 dark:text-rose-300",
  warning:
    "border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-300",
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
  const { cachedCollections, cacheLoaded } = useCachedCollections(
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
        initialCollectionsLoaded={cacheLoaded}
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
    <div className="auth-grid h-full w-full overflow-y-auto bg-[#1c201c] p-3 sm:p-6">
      <main className="mx-auto grid min-h-full w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/8 bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[42rem] overflow-hidden bg-[#242824] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-xl shadow-[0_12px_32px_rgba(240,100,69,0.3)]">
                <FontAwesomeIcon icon={faCat} />
              </span>
              <div>
                <p className="text-lg font-bold leading-none">Tabby</p>
                <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/40">
                  Your link library
                </p>
              </div>
            </div>
            <h2 className="mt-16 max-w-md text-5xl font-bold leading-[1.02] tracking-[-0.055em] xl:text-6xl">
              Keep the good parts of the internet.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55">
              A calm home for the links you use, love, and don’t want to lose.
              Organised your way and synced everywhere.
            </p>
          </div>
          <div className="relative z-10 mt-14 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="text-[var(--accent)]"
              />
              <p className="mt-5 text-sm font-bold">One clear workspace</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Collections and folders keep everything easy to scan.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <FontAwesomeIcon
                icon={faCloudArrowUp}
                className="text-emerald-400"
              />
              <p className="mt-5 text-sm font-bold">Always in sync</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Pick up from the same place on every browser.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-28 -top-24 size-80 rounded-full bg-[var(--accent)]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-amber-300/8 blur-3xl" />
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg text-white">
                <FontAwesomeIcon icon={faCat} />
              </span>
              <span className="text-lg font-bold text-[var(--ink)]">Tabby</span>
            </div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              {mode === "login" ? "Welcome back" : "By invitation"}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[var(--ink)]">
              {mode === "login" ? "Open your workspace" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {mode === "login"
                ? "Sign in to get back to your collections and saved links."
                : "Use your invitation to start building your personal library."}
            </p>

            <div className="mt-7 space-y-3">
              {error && <Banner tone="warning">{error.message}</Banner>}
              {formError && <Banner tone="danger">{formError}</Banner>}
            </div>

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
              <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
                  <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
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
                  <label className="flex flex-col gap-2 text-xs font-bold text-[var(--ink)]">
                    Invitation code
                    <input
                      required
                      name="invitationCode"
                      type="text"
                      placeholder="Your invite-only code"
                      value={form.invitationCode}
                      onChange={handleChange}
                      disabled={missingInviteCode}
                      className={inputClasses}
                    />
                  </label>
                  {missingInviteCode && (
                    <p className="flex items-start gap-2 rounded-xl bg-[var(--surface-muted)] p-3 text-xs leading-5 text-[var(--muted)]">
                      <FontAwesomeIcon icon={faKey} className="mt-1" />
                      <span>
                        Set <code className="font-bold">VITE_INVITE_CODE</code>{" "}
                        in your environment to enable registration.
                      </span>
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
              className={`${subtleButtonClasses} mt-3`}
              onClick={toggleMode}
              type="button"
            >
              {mode === "login"
                ? "Have an invite? Create an account"
                : "Already have an account? Sign in"}
            </button>
            <p className="mt-8 text-center text-[0.65rem] leading-5 text-[var(--muted)]">
              Your workspace is securely synced with Firebase.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthGate;
