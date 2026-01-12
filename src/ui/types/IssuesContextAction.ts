import type { DismissedMap } from "../../shared/types/DismissedMap";
import type { Issue } from "../../shared/types/Issue";
import type { UiAction } from "./UiAction";

export type IssuesContextAction =
  | { type: typeof UiAction.LoadStart }
  | {
      type: typeof UiAction.LoadSuccess;
      issues: Issue[];
      dismissed: DismissedMap;
    }
  | { type: typeof UiAction.LoadError; error: string }
  | { type: typeof UiAction.SetDismissed; dismissed: DismissedMap }
  | { type: typeof UiAction.ClearIssues };
