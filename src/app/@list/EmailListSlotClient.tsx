'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import EmailListPanel from '@/components/EmailListPanel';
import { PaginatedResult } from '@/services/emailService';
import { Email } from '@/lib/schema';
import { EmailListParams } from '@/lib/searchParams';

interface Props {
  initialParams: EmailListParams;
  initialData: PaginatedResult<Email>;
}

function EmailListContent({ initialParams, initialData }: Props) {
  const params = useParams();
  const threadId = params.threadId as string | undefined;

  return (
    <EmailListPanel
      selectedThreadId={threadId ?? null}
      initialData={initialData}
      initialFilter={initialParams.filter}
    />
  );
}

export default function EmailListSlotClient(props: Props) {
  return (
    <Suspense
      fallback={
        <Box
          sx={{ display: 'flex', justifyContent: 'center', p: 4, width: 400 }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <EmailListContent {...props} />
    </Suspense>
  );
}
