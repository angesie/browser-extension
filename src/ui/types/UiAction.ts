export const UiAction = {
  LoadStart: "LOAD_START",
  LoadSuccess: "LOAD_SUCCESS",
  LoadError: "LOAD_ERROR",
  SetDismissed: "SET_DISMISSED",
  ClearIssues: "CLEAR_ISSUES",
} as const;

export type UiAction = (typeof UiAction)[keyof typeof UiAction];
