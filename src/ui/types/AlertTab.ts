export const AlertTab = {
  IssuesFound: "Issues Found",
  History: "History",
} as const;

export type AlertTab = (typeof AlertTab)[keyof typeof AlertTab];
