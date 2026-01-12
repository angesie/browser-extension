import { Box, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useState, type SyntheticEvent } from "react";
import { AlertTab } from "../types/AlertTab";
import CustomTabPanel from "./CustomTabPanel";
import IssuesFoundTab from "./IssuesFoundTab";
import HistoryTab from "./HistoryTab";

export default function Alert() {
  const [value, setValue] = useState<AlertTab>(AlertTab.IssuesFound);

  const handleChange = (_: SyntheticEvent, newValue: AlertTab) => {
    setValue(newValue);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Prompt Monitoring Browser Extension</Typography>
      </Stack>

      <Divider />

      <Tabs value={value} onChange={handleChange}>
        <Tab label={AlertTab.IssuesFound} value={AlertTab.IssuesFound} />
        <Tab label={AlertTab.History} value={AlertTab.History} />
      </Tabs>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <CustomTabPanel value={value} index={AlertTab.IssuesFound}>
          <IssuesFoundTab />
        </CustomTabPanel>

        <CustomTabPanel value={value} index={AlertTab.History}>
          <HistoryTab />
        </CustomTabPanel>
      </Box>
    </Stack>
  );
}
