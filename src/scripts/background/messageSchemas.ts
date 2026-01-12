import { z } from "zod";
import { MESSAGE_SOURCE } from "../../shared/constants/messageSource";
import { MessageKind } from "../../shared/types/MessageKind";

export const ScanRequestSchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  kind: z.literal(MessageKind.ScanRequest),
  id: z.string(),
  url: z.string(),
  method: z.string(),
  bodyText: z.string(),
});

export const DismissEmailSchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  kind: z.literal(MessageKind.DismissEmail),
  email: z.string().min(1),
});

export const GetHistorySchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  kind: z.literal(MessageKind.GetHistory),
});

export const ClearHistorySchema = z.object({
  source: z.literal(MESSAGE_SOURCE),
  kind: z.literal(MessageKind.ClearHistory),
});

export type ScanRequest = z.infer<typeof ScanRequestSchema>;

export const AnyMessageSchema = z.discriminatedUnion("kind", [
  ScanRequestSchema,
  DismissEmailSchema,
  GetHistorySchema,
  ClearHistorySchema,
]);

export type AnyMessage = z.infer<typeof AnyMessageSchema>;
