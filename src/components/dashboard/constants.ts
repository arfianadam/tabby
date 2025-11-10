export const panelClass =
  'rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-4'

export const inputClasses =
  'w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export const actionButtonClasses =
  'inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition cursor-pointer active:bg-indigo-700 active:translate-y-px active:shadow-inner disabled:cursor-not-allowed disabled:opacity-50'

export const subtleButtonClasses =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'

export const toastToneClasses = {
  info: 'bg-slate-900/95 text-white',
  success: 'bg-emerald-600/95 text-white',
  danger: 'bg-rose-600/95 text-white',
} as const

export const TOAST_ANIMATION_DURATION_MS = 200

export type ToastTone = keyof typeof toastToneClasses
