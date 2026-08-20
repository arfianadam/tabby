export const panelClass =
  "rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] flex flex-col";

export const inputClasses =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] focus:outline-none focus:ring-3 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-55";

export const actionButtonClasses =
  "inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(240,100,69,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

export const subtleButtonClasses =
  "inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--muted)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export const toastToneClasses = {
  info: "bg-[#252824]/95 text-white",
  success: "bg-emerald-700/95 text-white",
  warning: "bg-amber-600/95 text-white",
  danger: "bg-rose-700/95 text-white",
} as const;

export const dangerGhostButtonClasses =
  "flex cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-400";

export const editorControlButtonClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/8";

export const dangerEditorControlButtonClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[var(--muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-rose-400";

export const TOAST_ANIMATION_DURATION_MS = 200;

export type ToastTone = keyof typeof toastToneClasses;
