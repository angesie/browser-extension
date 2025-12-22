import type { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { MessageKind } from "../../shared/types/MessageKind";

export type ScanResponseMessage = {
  source: typeof MESSAGE_SOURCE;
  kind: typeof MessageKind.ScanResponse;
  id: string;
  sanitizedBodyText: string;
};
