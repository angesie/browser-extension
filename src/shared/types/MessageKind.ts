export const MessageKind = {
  ScanRequest: "SCAN_REQUEST",
  ScanResponse: "SCAN_RESPONSE",
  GetHistory: "GET_HISTORY",
  DismissEmail: "DISMISS_EMAIL",
  ClearHistory: "CLEAR_HISTORY"
} as const;

export type MessageKind = (typeof MessageKind)[keyof typeof MessageKind];
