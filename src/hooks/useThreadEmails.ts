import { useQuery } from '@tanstack/react-query';
import { Email } from '@/lib/schema';

async function fetchThreadEmails(
  threadId: string,
  filter?: string,
): Promise<Email[]> {
  const params = new URLSearchParams({ threadId });
  if (filter) {
    params.append('filter', filter);
  }
  const response = await fetch(`/api/emails?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch thread emails');
  }

  const result = await response.json();
  return result.data;
}

export function useThreadEmails(
  threadId: string | null,
  filter?: string,
  initialData?: Email[],
) {
  return useQuery({
    queryKey: ['thread', threadId, filter],
    queryFn: () => fetchThreadEmails(threadId!, filter),
    enabled: !!threadId,
    initialData,
  });
}
