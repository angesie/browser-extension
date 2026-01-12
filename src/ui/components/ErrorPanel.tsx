import { Stack, Alert, Button } from "@mui/material";
import type { ReactElement } from "react";

type Props = {
  message: string;
  onRetry(): void | Promise<void>;
};

export default function ErrorPanel({ message, onRetry }: Props): ReactElement {
  return (
    <Stack spacing={1}>
      <Alert severity="error">{message}</Alert>
      <Button
        variant="contained"
        onClick={onRetry}
        sx={{ px: 3, alignSelf: "flex-start" }}
      >
        Retry
      </Button>
    </Stack>
  );
}
