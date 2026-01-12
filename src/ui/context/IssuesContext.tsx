import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { sendMessage } from "../lib/runtime";
import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { MessageKind } from "../../shared/types/MessageKind";
import type { Issue } from "../../shared/types/Issue";
import { normalizeEmail } from "../../shared/utils";

type DismissedMap = Record<string, number>;

type State = {
  loading: boolean;
  error: string | null;
  issues: Issue[];
  dismissed: DismissedMap;
};

type Action =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; issues: Issue[]; dismissed: DismissedMap }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SET_DISMISSED"; dismissed: DismissedMap }
  | { type: "CLEAR_ISSUES" };

const initialState: State = {
  loading: true,
  error: null,
  issues: [],
  dismissed: {},
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS":
      return {
        loading: false,
        error: null,
        issues: action.issues,
        dismissed: action.dismissed,
      };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };
    case "SET_DISMISSED":
      return { ...state, dismissed: action.dismissed };
    case "CLEAR_ISSUES":
      return { ...state, issues: [] };
    default:
      return state;
  }
}

type Context = State & {
  refresh(): Promise<void>;
  dismissEmail(email: string): Promise<void>;
  clearHistory(): Promise<void>;
  latestIssue: Issue | null;
  isDismissedUntil(email: string): { dismissed: boolean; until: number };
};

const IssuesContext = createContext<Context | null>(null);

export function IssuesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const res = await sendMessage<
        { source: string; kind: typeof MessageKind.GetHistory },
        { issues: Issue[]; dismissed: DismissedMap }
      >({
        source: MESSAGE_SOURCE,
        kind: MessageKind.GetHistory,
      });

      dispatch({
        type: "LOAD_SUCCESS",
        issues: res.issues ?? [],
        dismissed: res.dismissed ?? {},
      });
    } catch (e) {
      dispatch({
        type: "LOAD_ERROR",
        error: (e as Error)?.message ?? "Failed to load history",
      });
    }
  };

  const dismissEmail = async (email: string) => {
    await sendMessage<
      { source: string; kind: typeof MessageKind.DismissEmail; email: string },
      { ok: boolean }
    >({
      source: MESSAGE_SOURCE,
      kind: MessageKind.DismissEmail,
      email,
    });

    await refresh();
  };

  const clearHistory = async () => {
    await sendMessage<
      { source: string; kind: typeof MessageKind.ClearHistory },
      { ok: boolean }
    >({
      source: MESSAGE_SOURCE,
      kind: MessageKind.ClearHistory,
    });
    dispatch({ type: "CLEAR_ISSUES" });
  };

  useEffect(() => {
    void refresh();
  }, []);

  const latestIssue = useMemo(() => {
    if (!state.issues.length) return null;
    return (
      state.issues.reduce(
        (best, cur) =>
          (cur.createdAt ?? 0) > (best.createdAt ?? 0) ? cur : best,
        state.issues[0],
      ) ?? null
    );
  }, [state.issues]);

  const isDismissedUntil = (email: string) => {
    const until = state.dismissed[normalizeEmail(email)] ?? 0;
    return { dismissed: until > Date.now(), until };
  };

  const value: Context = {
    ...state,
    refresh,
    dismissEmail,
    clearHistory,
    latestIssue,
    isDismissedUntil,
  };

  return (
    <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error("useIssues must be used within IssuesProvider");
  return context;
}
