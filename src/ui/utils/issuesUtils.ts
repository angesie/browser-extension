import type { DismissedMap } from "../../shared/types/DismissedMap";

export function getLatestIssue<T extends { createdAt?: number }>(
  issues: T[],
): T | null {
  if (!issues || !issues.length) return null;
  return issues.reduce(
    (best, cur) => ((cur.createdAt ?? 0) > (best.createdAt ?? 0) ? cur : best),
    issues[0],
  );
}

export function computeIsDismissedUntil(
  dismissed: DismissedMap,
  email: string,
) {
  const until = dismissed[email] ?? 0;
  return { dismissed: until > Date.now(), until };
}
