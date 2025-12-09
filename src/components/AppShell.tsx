'use client';

import { Suspense } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import ComposerManager from './ComposerManager';

interface AppShellProps {
  list: React.ReactNode;
  thread?: React.ReactNode;
}

export default function AppShell({ list, thread }: AppShellProps) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      {list}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          overflow: 'hidden',
        }}
        data-testid="email-content-panel"
      >
        {thread}
      </Box>
      <ComposerManager />
    </Box>
  );
}
