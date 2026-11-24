import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCat,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCloudArrowUp,
  faEye,
  faEyeSlash,
  faKey,
  faLayerGroup,
  faRightToBracket,
  faSpinner,
  faTriangleExclamation,
  faUserPlus,
} from "@/utils/uiIcons";
import { useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type { FormEvent, ReactNode } from "react";
import { auth } from "@/firebase/client";
import { useAuthState } from "@/hooks/useAuthState";
import Dashboard from "@/features/dashboard";
import WorkspaceBootstrap from "@/components/WorkspaceBootstrap";

const inputClasses =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-[var(--accent)]/15 disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClasses =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--accent-fill)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(207,67,38,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-fill-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0";
const subtleButtonClasses =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

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

const formatAuthError = (err: unknown, fallback: string): string => {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please check your details and try again.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "Unable to reach Firebase. Check your internet connection.";
    default:
      return err instanceof Error && !err.message.startsWith("Firebase:")
        ? err.message
        : fallback;
  }
};

const initialForm = {
  email: "",
  password: "",
  confirmPassword: "",
  invitationCode: "",
};

const AuthGate = () => {
  const { user, cachedUser, initializing, error, cacheReady } = useAuthState();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
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
    setFormNotice(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
    } catch (err) {
      setFormError(formatAuthError(err, "Unable to sign in right now."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormNotice(null);

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
      await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password,
      );
    } catch (err) {
      setFormError(
        formatAuthError(err, "Unable to create your account right now."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormNotice(null);
    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      setFormError("Enter the email address for your account.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setFormNotice(
        "If an account exists for that email, a password reset link has been sent.",
      );
    } catch (err) {
      setFormError(
        formatAuthError(
          err,
          "Unable to send a password reset email right now.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode: "login" | "register" | "reset") => {
    setMode(nextMode);
    setForm((prev) => ({ ...initialForm, email: prev.email }));
    setFormError(null);
    setFormNotice(null);
    setShowPassword(false);
  };

  const workspaceUser = user ?? cachedUser ?? null;
  const isColdStart = initializing && !workspaceUser;

  if (isColdStart) {
    return <WorkspaceBootstrap />;
  }

  if (workspaceUser) {
    return (
      <Dashboard
        key={workspaceUser.uid}
        user={workspaceUser}
        allowSync={Boolean(user)}
        cacheReady={cacheReady}
      />
    );
  }

  const onSubmit =
    mode === "login"
      ? handleLogin
      : mode === "register"
        ? handleRegister
        : handleReset;

  const Banner = ({
    tone,
    children,
  }: {
    tone: keyof typeof bannerToneClasses;
    children: ReactNode;
  }) => (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${bannerToneClasses[tone]}`}
    >
      <FontAwesomeIcon
        icon={bannerToneIcons[tone]}
        className="mt-0.5 shrink-0 text-base"
      />
      <span>{children}</span>
    </div>
  );

  const actionIcon = submitting
    ? faSpinner
    : mode === "login"
      ? faRightToBracket
      : mode === "register"
        ? faUserPlus
        : faKey;

  const eyebrow =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
        ? "By invitation"
        : "Account recovery";

  const heading =
    mode === "login"
      ? "Open your workspace"
      : mode === "register"
        ? "Create your account"
        : "Reset your password";

  const description =
    mode === "login"
      ? "Sign in to get back to your collections and saved links."
      : mode === "register"
        ? "Use your invitation to start building your personal library."
        : "We’ll email you a link to set a new password.";

  return (
    <div className="auth-grid h-full w-full overflow-y-auto bg-[#1c201c] p-3 sm:p-6">
      <main className="mx-auto grid min-h-full w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--surface)] shadow-[0_32px_100px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[42rem] overflow-hidden bg-[#242824] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-fill)] text-xl shadow-[0_12px_32px_rgba(207,67,38,0.32)]">
                <FontAwesomeIcon icon={faCat} />
              </span>
              <div>
                <p className="text-lg font-bold leading-none">Tabby</p>
                <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-white/65">
                  Your link library
                </p>
              </div>
            </div>
            <h2 className="mt-16 max-w-md text-5xl font-bold leading-[1.02] tracking-[-0.055em] xl:text-6xl">
              Keep the good parts of the internet.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              A calm home for the links you use, love, and don’t want to lose.
              Organised your way and synced everywhere.
            </p>
          </div>
          <div className="relative z-10 mt-14 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="text-[var(--accent)]"
              />
              <p className="mt-5 text-sm font-bold">One clear workspace</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Collections and folders keep everything easy to scan.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <FontAwesomeIcon
                icon={faCloudArrowUp}
                className="text-emerald-400"
              />
              <p className="mt-5 text-sm font-bold">Always in sync</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Pick up from the same place on every browser.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-28 -top-24 size-80 rounded-full bg-[var(--accent)]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-amber-300/8 blur-3xl" />
        </section>

        <section className="flex items-center justify-center px-5 py-7 sm:px-10 sm:py-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-fill)] text-lg text-white">
                <FontAwesomeIcon icon={faCat} />
              </span>
              <span className="text-lg font-bold text-[var(--ink)]">Tabby</span>
            </div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              {eyebrow}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>

            {(error || formError || formNotice) && (
              <div className="mt-5 space-y-2.5">
                {error && <Banner tone="warning">{error.message}</Banner>}
                {formError && <Banner tone="danger">{formError}</Banner>}
                {formNotice && <Banner tone="success">{formNotice}</Banner>}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
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

              {mode !== "reset" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="text-xs font-bold text-[var(--ink)]"
                    >
                      Password
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("reset")}
                        className="cursor-pointer rounded text-xs font-semibold text-[var(--accent)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      required
                      name="password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className={`${inputClasses} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="text-sm"
                      />
                    </button>
                  </div>
                  {mode === "register" && (
                    <span className="text-xs text-[var(--muted)]">
                      Use at least 8 characters.
                    </span>
                  )}
                </div>
              )}

              {mode === "register" && (
                <>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
                    Confirm password
                    <input
                      required
                      name="confirmPassword"
                      autoComplete="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--ink)]">
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
                    : mode === "register"
                      ? "Create account"
                      : "Send reset link"}
              </button>
            </form>

            <button
              className={`${subtleButtonClasses} mt-3`}
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
              type="button"
            >
              {mode === "login"
                ? "Have an invite? Create an account"
                : "Back to sign in"}
            </button>
            <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">
              Your workspace is securely synced with Firebase.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthGate;
