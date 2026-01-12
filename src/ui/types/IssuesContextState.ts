import type { DismissedMap } from "../../shared/types/DismissedMap";
import type { Issue } from "../../shared/types/Issue";

export type IssuesContextState = {
  loading: boolean;
  error: string | null;
  issues: Issue[];
  dismissed: DismissedMap;
};