import { getEmails } from '@/services/emailService';
import ThreadViewClient from './ThreadViewClient';
import { notFound } from 'next/navigation';
import { EmailFilter } from '@/lib/validations';

interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ filter?: EmailFilter }>;
}

export default async function ThreadPage({
  params,
  searchParams,
}: ThreadPageProps) {
  const { threadId } = await params;
  const { filter } = await searchParams;

  const result = await getEmails({
    threadId,
    filter,
    threadOnly: false,
  });

  const threadEmails = result.data;

  if (threadEmails.length === 0) {
    notFound();
  }

  const subject = threadEmails.at(0)?.subject;

  const isTrashView = filter === 'trash';

  return (
    <ThreadViewClient
      threadId={threadId}
      subject={subject ?? ''}
      initialEmails={threadEmails}
      isTrashView={isTrashView}
      filter={filter}
    />
  );
}
