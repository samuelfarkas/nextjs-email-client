import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

async function restoreThread(threadId: string): Promise<void> {
  const response = await fetch(
    `/api/emails/thread/${encodeURIComponent(threadId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ restore: true }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to restore thread');
  }
}

export function useRestoreThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreThread,
    onMutate: async (threadId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['emails'] });
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] });

      // Snapshot the previous values
      const previousEmails = queryClient.getQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
      );

      // Optimistically remove the thread from trash view
      queryClient.setQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((email) => email.threadId !== threadId),
          };
        },
      );

      return { previousEmails };
    },
    onError: (_err, _threadId, context) => {
      // Rollback on error
      if (context?.previousEmails) {
        context.previousEmails.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, threadId) => {
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threadCounts'] });
    },
  });
}
