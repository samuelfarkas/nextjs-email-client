import { Box, CircularProgress } from '@mui/material';

export default function ThreadViewLoading() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
