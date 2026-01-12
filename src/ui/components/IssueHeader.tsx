import { Typography } from "@mui/material";
import type { ReactElement } from "react";
import { formatDateDMY } from "../utils/dateUtils";

type Props = {
  createdAt?: number | null;
  method?: string | null;
  url?: string | null;
};

export default function IssueHeader({
  createdAt,
  method,
  url,
}: Props): ReactElement {
  return (
    <Typography variant="caption" color="text.secondary">
      {formatDateDMY(createdAt)} • {method} • {url}
    </Typography>
  );
}
