import { Box, Typography } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

export default function ThreadDefault() {
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
        <EmailIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Select an email to view
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose an email from the list to see its content here
        </Typography>
      </Box>
    </Box>
  );
}
