import { TableRow, TableCell, Button, Chip, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { formatUntil } from "../utils/dateUtils";

type Props = {
  email: string;
  dismissed: boolean;
  until?: number;
  onDismiss(email: string): void | Promise<void>;
};

export default function EmailRow({ email, dismissed, until, onDismiss }: Props): ReactElement {
  return (
    <TableRow key={email}>
      <TableCell sx={{ maxWidth: 300, wordBreak: "break-all" }}>{email}</TableCell>
      <TableCell>
        {dismissed ? (
          <Typography variant="caption" color="text.secondary">
            Dismissed until {until ? formatUntil(until) : "-"}
          </Typography>
        ) : (
          <Chip label="Active" size="small" color="primary" />
        )}
      </TableCell>
      <TableCell align="right">
        {!dismissed ? (
          <Button size="small" variant="contained" onClick={() => onDismiss(email)}>
            Dismiss 24h
          </Button>
        ) : (
          <Button size="small" variant="outlined" disabled>
            Dismissed
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
