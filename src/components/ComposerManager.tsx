'use client';

import dynamic from 'next/dynamic';
import { Box, Skeleton, Card } from '@mui/material';
import { useAtomValue } from 'jotai';
import { composerIdsAtom, composersMapAtom } from '@/store/composers';

const EmailComposer = dynamic(() => import('./EmailComposer'), {
  loading: () => (
    <Card sx={{ width: 400, height: 400, p: 2 }}>
      <Skeleton variant="text" width="60%" height={32} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mt: 2 }} />
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
    </Card>
  ),
  ssr: false,
});

export default function ComposerManager() {
  const composerIds = useAtomValue(composerIdsAtom);
  const composersMap = useAtomValue(composersMapAtom);

  if (composerIds.length === 0) {
    return null;
  }

  const fullscreenIds = composerIds.filter(
    (id) => composersMap.get(id)?.isFullscreen,
  );
  const compactIds = composerIds.filter(
    (id) => !composersMap.get(id)?.isFullscreen,
  );

  return (
    <>
      {fullscreenIds.map((id) => (
        <EmailComposer key={id} composerId={id} />
      ))}

      {compactIds.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 24,
            display: 'flex',
            flexDirection: 'row-reverse',
            alignItems: 'flex-end',
            gap: 2,
            zIndex: 1300,
            pointerEvents: 'none',
            '& > *': {
              pointerEvents: 'auto',
            },
          }}
        >
          {compactIds.map((id) => (
            <EmailComposer key={id} composerId={id} />
          ))}
        </Box>
      )}
    </>
  );
}
