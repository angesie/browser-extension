import type { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import type { MessageKind } from "../../shared/types/MessageKind";

export type ScanRequestMessage = {
  source: typeof MESSAGE_SOURCE;
  kind: typeof MessageKind.ScanRequest;
  id: string;
  url: string;
  method: string;
  bodyText: string;
};
