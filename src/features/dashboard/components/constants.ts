export const panelClass =
  "rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] flex flex-col";

export const inputClasses =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-[var(--accent)]/15 disabled:cursor-not-allowed disabled:opacity-55";

export const actionButtonClasses =
  "inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--accent-fill)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(207,67,38,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-fill-hover)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0";

export const subtleButtonClasses =
  "inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--muted)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0";

export const toastToneClasses = {
  info: "bg-[#252824]/95 text-white",
  success: "bg-emerald-700/95 text-white",
  warning: "bg-amber-700/95 text-white",
  danger: "bg-rose-700/95 text-white",
} as const;

export const dangerGhostButtonClasses =
  "flex cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-400";

export const editorControlButtonClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10";

export const dangerEditorControlButtonClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[var(--muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-400";

export const TOAST_ANIMATION_DURATION_MS = 200;

export type ToastTone = keyof typeof toastToneClasses;
