import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { useIssues } from "../context/IssuesContext";
import IssueHeader from "./IssueHeader";
import EmailTable from "./EmailTable";
import ErrorPanel from "./ErrorPanel";

export default function HistoryTab() {
  const {
    loading,
    error,
    issues,
    dismissEmail,
    isDismissedUntil,
    refresh,
    clearHistory,
  } = useIssues();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) return <ErrorPanel message={error} onRetry={refresh} />;

  if (!issues.length) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          History is empty.
        </Typography>
        <Button variant="contained" onClick={refresh} sx={{ alignSelf: "start" }}>
          Refresh
        </Button>
      </Stack>
    );
  }

  const sorted = [...issues].sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
  );

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button size="small" variant="outlined" onClick={refresh}>
          Refresh
        </Button>
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={clearHistory}
        >
          Clear
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        {sorted.map((issue) => (
          <Paper key={issue.id} variant="outlined" sx={{ p: 1 }}>
            <Stack spacing={1}>
              <IssueHeader
                createdAt={issue.createdAt}
                method={issue.method}
                url={issue.url}
              />

              <EmailTable
                emails={issue.emails ?? []}
                isDismissedUntil={isDismissedUntil}
                onDismiss={dismissEmail}
              />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
