import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useIssues } from "../context/IssuesContext";

function formatUntil(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function IssuesFoundTab() {
  const { loading, error, latestIssue, dismissEmail, isDismissed, refresh } = useIssues();

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={1} sx={{ py: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={refresh}>Retry</Button>
      </Stack>
    );
  }

  const emails = latestIssue?.emails ?? [];

  if (!emails.length) {
    return (
      <Stack spacing={1.5} sx={{ py: 2 }}>
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
    <Stack spacing={1.5} sx={{ py: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Detected email addresses (latest):
      </Typography>

      <Stack spacing={1}>
        {emails.map((email) => {
          const d = isDismissed(email);
          return (
            <Box
              key={email}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Chip label={email} variant="outlined" />
              {d.dismissed ? (
                <Typography variant="caption" color="text.secondary">
                  Dismissed until {formatUntil(d.until)}
                </Typography>
              ) : (
                <Button size="small" variant="contained" onClick={() => dismissEmail(email)}>
                  Dismiss 24h
                </Button>
              )}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
