import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { sendMessage } from "../lib/runtime";
import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { MessageKind } from "../../shared/types/MessageKind";
import type { Issue } from "../../shared/types/Issue";
import { normalizeEmail } from "../../shared/utils";
import { getLatestIssue, computeIsDismissedUntil } from "../utils/issuesUtils";
import type { DismissedMap } from "../../shared/types/DismissedMap";
import type { IssuesContextState } from "../types/IssuesContextState";
import type { IssuesContextAction } from "../types/IssuesContextAction";
import { UiAction } from "../types/UiAction";

const initialState: IssuesContextState = {
  loading: true,
  error: null,
  issues: [],
  dismissed: {},
};

export type IssuesContext = IssuesContextState & {
  refresh(): Promise<void>;
  dismissEmail(email: string): Promise<void>;
  clearHistory(): Promise<void>;
  latestIssue: Issue | null;
  isDismissedUntil(email: string): { dismissed: boolean; until: number };
};

function reducer(
  state: IssuesContextState,
  action: IssuesContextAction,
): IssuesContextState {
  switch (action.type) {
    case UiAction.LoadStart:
      return { ...state, loading: true, error: null };
    case UiAction.LoadSuccess:
      return {
        loading: false,
        error: null,
        issues: action.issues,
        dismissed: action.dismissed,
      };
    case UiAction.LoadError:
      return { ...state, loading: false, error: action.error };
    case UiAction.SetDismissed:
      return { ...state, dismissed: action.dismissed };
    case UiAction.ClearIssues:
      return { ...state, issues: [] };
    default:
      return state;
  }
}

const IssuesContext = createContext<IssuesContext | null>(null);

export function IssuesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useRef(true);
  const refreshing = useRef(false);
  const stateRef = useRef(state);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    dispatch({ type: UiAction.LoadStart });
    try {
      const res = await sendMessage<
        { source: string; kind: typeof MessageKind.GetHistory },
        { issues: Issue[]; dismissed: DismissedMap }
      >({ source: MESSAGE_SOURCE, kind: MessageKind.GetHistory });

      if (!isMounted.current) return;

      dispatch({
        type: UiAction.LoadSuccess,
        issues: res.issues ?? [],
        dismissed: res.dismissed ?? {},
      });
    } catch (e) {
      if (!isMounted.current) return;
      dispatch({
        type: UiAction.LoadError,
        error: (e as Error)?.message ?? "Failed to load history",
      });
    } finally {
      refreshing.current = false;
    }
  }, []);

  const dismissEmail = useCallback(async (email: string) => {
    const key = normalizeEmail(email);
    const prev = stateRef.current.dismissed;
    const next = { ...prev, [key]: Date.now() + 24 * 60 * 60 * 1000 };
    dispatch({ type: UiAction.SetDismissed, dismissed: next });

    try {
      await sendMessage<
        {
          source: string;
          kind: typeof MessageKind.DismissEmail;
          email: string;
        },
        { ok: boolean }
      >({ source: MESSAGE_SOURCE, kind: MessageKind.DismissEmail, email });
    } catch (e) {
      dispatch({ type: UiAction.SetDismissed, dismissed: prev });
      throw e;
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await sendMessage<
        { source: string; kind: typeof MessageKind.ClearHistory },
        { ok: boolean }
      >({
        source: MESSAGE_SOURCE,
        kind: MessageKind.ClearHistory,
      });
      dispatch({ type: UiAction.ClearIssues });
    } catch (e) {
      dispatch({
        type: UiAction.LoadError,
        error: (e as Error)?.message ?? "Failed to clear history",
      });
      throw e;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted.current = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const latestIssue = useMemo(
    () => getLatestIssue(state.issues),
    [state.issues],
  );

  const isDismissedUntil = useCallback(
    (email: string) => {
      return computeIsDismissedUntil(state.dismissed, normalizeEmail(email));
    },
    [state.dismissed],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const value: IssuesContext = useMemo(
    () => ({
      ...state,
      refresh,
      dismissEmail,
      clearHistory,
      latestIssue,
      isDismissedUntil,
    }),
    [state, refresh, dismissEmail, clearHistory, latestIssue, isDismissedUntil],
  );

  return (
    <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error("useIssues must be used within IssuesProvider");
  return context;
}
