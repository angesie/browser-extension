export const StorageKey = {
  Issues: "pm_issues",
  Dismissed: "pm_dismissed",
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];
