import { getEmails } from '@/services/emailService';
import { parseEmailListParams, EmailListParams } from '@/lib/searchParams';
import EmailListSlotClient from './EmailListSlotClient';

interface ListSlotProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EmailListSlot({ searchParams }: ListSlotProps) {
  const rawParams = await searchParams;

  const parsedParams: EmailListParams = parseEmailListParams(rawParams);
  const { filter, page, pageSize } = parsedParams;

  const initialData = await getEmails({
    filter,
    threadOnly: true,
    page,
    pageSize,
  });

  return (
    <EmailListSlotClient
      initialParams={parsedParams}
      initialData={initialData}
    />
  );
}
