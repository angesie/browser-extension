import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
} from "@mui/material";
import type { ReactElement } from "react";
import EmailRow from "./EmailRow";

type DismissCheck = (email: string) => { dismissed: boolean; until: number };

type Props = {
  emails: string[];
  isDismissedUntil: DismissCheck;
  onDismiss(email: string): void | Promise<void>;
};

export default function EmailTable({
  emails,
  isDismissedUntil,
  onDismiss,
}: Props): ReactElement {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ boxShadow: "none" }}
    >
      <Table size="small" sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((email) => {
            const d = isDismissedUntil(email);
            return (
              <EmailRow
                key={email}
                email={email}
                dismissed={d.dismissed}
                until={d.until}
                onDismiss={onDismiss}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
