import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useIssues } from "../context/IssuesContext";
import EmailTable from "./EmailTable";
import ErrorPanel from "./ErrorPanel";

export default function IssuesFoundTab() {
  const { loading, error, latestIssue, dismissEmail, isDismissedUntil, refresh } = useIssues();

  if (loading) {
    return (
      <Box sx={{  display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) return <ErrorPanel message={error} onRetry={refresh} />;

  const emails = latestIssue?.emails ?? [];

  if (!emails.length) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          No emails detected in the latest submission.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Tip: send a message containing an email to test detection.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Detected email addresses (latest):
      </Typography>

      <EmailTable emails={emails} isDismissedUntil={isDismissedUntil} onDismiss={dismissEmail} />
    </Stack>
  );
}
