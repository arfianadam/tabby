export type FolderColorStyles = {
  bg: string;
  text: string;
  border: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
};

const colorPalette: FolderColorStyles[] = [
  {
    // Red
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-900 dark:text-red-100",
    border: "border-red-200 dark:border-red-700/50",
    icon: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-200 dark:bg-red-800",
    badgeText: "text-red-800 dark:text-red-200",
  },
  {
    // Orange
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-900 dark:text-orange-100",
    border: "border-orange-200 dark:border-orange-700/50",
    icon: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-200 dark:bg-orange-800",
    badgeText: "text-orange-800 dark:text-orange-200",
  },
  {
    // Amber
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-900 dark:text-amber-100",
    border: "border-amber-200 dark:border-amber-700/50",
    icon: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-200 dark:bg-amber-800",
    badgeText: "text-amber-800 dark:text-amber-200",
  },
  {
    // Yellow
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-900 dark:text-yellow-100",
    border: "border-yellow-200 dark:border-yellow-700/50",
    icon: "text-yellow-600 dark:text-yellow-400",
    badgeBg: "bg-yellow-200 dark:bg-yellow-800",
    badgeText: "text-yellow-800 dark:text-yellow-200",
  },
  {
    // Lime
    bg: "bg-lime-100 dark:bg-lime-900/30",
    text: "text-lime-900 dark:text-lime-100",
    border: "border-lime-200 dark:border-lime-700/50",
    icon: "text-lime-600 dark:text-lime-400",
    badgeBg: "bg-lime-200 dark:bg-lime-800",
    badgeText: "text-lime-800 dark:text-lime-200",
  },
  {
    // Green
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-900 dark:text-green-100",
    border: "border-green-200 dark:border-green-700/50",
    icon: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-200 dark:bg-green-800",
    badgeText: "text-green-800 dark:text-green-200",
  },
  {
    // Emerald
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-900 dark:text-emerald-100",
    border: "border-emerald-200 dark:border-emerald-700/50",
    icon: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-200 dark:bg-emerald-800",
    badgeText: "text-emerald-800 dark:text-emerald-200",
  },
  {
    // Teal
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-900 dark:text-teal-100",
    border: "border-teal-200 dark:border-teal-700/50",
    icon: "text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-200 dark:bg-teal-800",
    badgeText: "text-teal-800 dark:text-teal-200",
  },
  {
    // Cyan
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-900 dark:text-cyan-100",
    border: "border-cyan-200 dark:border-cyan-700/50",
    icon: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-200 dark:bg-cyan-800",
    badgeText: "text-cyan-800 dark:text-cyan-200",
  },
  {
    // Sky
    bg: "bg-sky-100 dark:bg-sky-900/30",
    text: "text-sky-900 dark:text-sky-100",
    border: "border-sky-200 dark:border-sky-700/50",
    icon: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-200 dark:bg-sky-800",
    badgeText: "text-sky-800 dark:text-sky-200",
  },
  {
    // Blue
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-900 dark:text-blue-100",
    border: "border-blue-200 dark:border-blue-700/50",
    icon: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-200 dark:bg-blue-800",
    badgeText: "text-blue-800 dark:text-blue-200",
  },
  {
    // Indigo
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-900 dark:text-indigo-100",
    border: "border-indigo-200 dark:border-indigo-700/50",
    icon: "text-indigo-600 dark:text-indigo-400",
    badgeBg: "bg-indigo-200 dark:bg-indigo-800",
    badgeText: "text-indigo-800 dark:text-indigo-200",
  },
  {
    // Violet
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-900 dark:text-violet-100",
    border: "border-violet-200 dark:border-violet-700/50",
    icon: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-200 dark:bg-violet-800",
    badgeText: "text-violet-800 dark:text-violet-200",
  },
  {
    // Purple
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-900 dark:text-purple-100",
    border: "border-purple-200 dark:border-purple-700/50",
    icon: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-200 dark:bg-purple-800",
    badgeText: "text-purple-800 dark:text-purple-200",
  },
  {
    // Fuchsia
    bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    text: "text-fuchsia-900 dark:text-fuchsia-100",
    border: "border-fuchsia-200 dark:border-fuchsia-700/50",
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeBg: "bg-fuchsia-200 dark:bg-fuchsia-800",
    badgeText: "text-fuchsia-800 dark:text-fuchsia-200",
  },
  {
    // Pink
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-900 dark:text-pink-100",
    border: "border-pink-200 dark:border-pink-700/50",
    icon: "text-pink-600 dark:text-pink-400",
    badgeBg: "bg-pink-200 dark:bg-pink-800",
    badgeText: "text-pink-800 dark:text-pink-200",
  },
];

export const getFolderColor = (name: string): FolderColorStyles => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colorPalette.length);
  return colorPalette[index];
};
