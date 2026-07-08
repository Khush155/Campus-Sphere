import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import { AccountBalanceOutlined } from '@mui/icons-material';
import FeeStructureTab from './FeeStructureTab';
import PaymentTab from './PaymentTab';

export const FeeHub = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          borderBottom: `1px solid ${theme.custom.border.subtle}`,
        }}
      >
        <AccountBalanceOutlined sx={{ color: theme.palette.primary.main }} />
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: theme.typography.h1.fontFamily,
              fontWeight: 600,
              color: theme.palette.ink[900],
              lineHeight: 1.1,
            }}
          >
            Fee Management
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.body2.fontFamily }}
          >
            Define fee structures and record student payments
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: `1px solid ${theme.custom.border.subtle}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': {
              fontFamily: theme.typography.body2.fontFamily,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.88rem',
              color: theme.palette.text.secondary,
              '&.Mui-selected': { color: theme.palette.primary.main },
            },
            '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main },
          }}
        >
          <Tab label="Fee Structures" id="fee-tab-0" aria-controls="fee-panel-0" />
          <Tab label="Payments & Receipts" id="fee-tab-1" aria-controls="fee-panel-1" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box role="tabpanel" id="fee-panel-0" hidden={activeTab !== 0}>
        {activeTab === 0 && <FeeStructureTab />}
      </Box>
      <Box role="tabpanel" id="fee-panel-1" hidden={activeTab !== 1}>
        {activeTab === 1 && <PaymentTab />}
      </Box>
    </Box>
  );
};

export default FeeHub;
