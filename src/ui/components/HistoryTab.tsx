import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useIssues } from "../context/IssuesContext";

function formatTs(ts: number) {
  return new Date(ts).toLocaleString();
}

function formatUntil(ts: number) {
  return new Date(ts).toLocaleString();
}

export default function HistoryTab() {
  const { loading, error, issues, dismissEmail, isDismissedUntil, refresh, clearHistory } = useIssues();

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

  if (!issues.length) {
    return (
      <Stack spacing={1.5} sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          History is empty.
        </Typography>
        <Button variant="outlined" onClick={refresh}>Refresh</Button>
      </Stack>
    );
  }

  const sorted = [...issues].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return (
    <Stack spacing={1.5} sx={{ py: 2 }}>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button size="small" variant="outlined" onClick={refresh}>Refresh</Button>
        <Button size="small" color="error" variant="outlined" onClick={clearHistory}>
          Clear
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        {sorted.map((issue) => (
          <Stack key={issue.id} spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {formatTs(issue.createdAt)} • {issue.method} • {issue.url}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(issue.emails ?? []).map((email) => {
                const d = isDismissedUntil(email);
                return (
                  <Stack key={`${issue.id}:${email}`} spacing={0.5}>
                    <Chip
                      size="small"
                      label={email}
                      variant={d.dismissed ? "filled" : "outlined"}
                    />
                    {d.dismissed ? (
                      <Typography variant="caption" color="text.secondary">
                        Dismissed until {formatUntil(d.until)}
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => dismissEmail(email)}
                        sx={{ alignSelf: "flex-start", px: 0 }}
                      >
                        Dismiss 24h
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>

            <Divider />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
