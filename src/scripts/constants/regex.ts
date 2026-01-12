export const JSON_CONTENT_TYPE_REGEX = /application\/json/i;

export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

export const CHATGPT_URL_PATTERNS: RegExp[] = [
  /:\/\/chatgpt\.com\/backend-api\/.*conversation/i,
  /:\/\/chatgpt\.com\/backend-api\/.*messages/i,
  /:\/\/chat\.openai\.com\/backend-api\/.*conversation/i,
];
