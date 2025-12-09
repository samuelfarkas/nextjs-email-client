import { Box, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

export default function ThreadNotFound() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        height: '100%',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Thread not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This email thread may have been deleted or does not exist
        </Typography>
      </Box>
    </Box>
  );
}
