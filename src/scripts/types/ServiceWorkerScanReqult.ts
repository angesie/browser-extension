export type ServiceWorkerScanResult = {
  sanitizedBodyText: string;
  alertEmails?: string[];
  isFinal?: boolean;
};