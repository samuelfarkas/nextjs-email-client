'use client';

import { useEffect } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h5" component="h2">
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message || 'An unexpected error occurred'}
        </Typography>
        {error.digest && (
          <Typography variant="caption" color="text.disabled">
            Error ID: {error.digest}
          </Typography>
        )}
        <Button variant="contained" onClick={reset} sx={{ mt: 2 }}>
          Try again
        </Button>
      </Box>
    </Container>
  );
}
