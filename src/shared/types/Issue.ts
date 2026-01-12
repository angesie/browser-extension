export type IssueEmail = {
  email: string;
  isDismissed: boolean;
};

export type Issue = {
  id: string;
  createdAt: number;
  url: string;
  method: string;
  isFinal: boolean;
  emails: IssueEmail[];
};
