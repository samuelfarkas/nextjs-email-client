import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(
    `/api/emails/thread/${encodeURIComponent(threadId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to delete thread');
  }
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThread,
    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: ['emails'] });
      await queryClient.cancelQueries({ queryKey: ['thread', threadId] });
      await queryClient.cancelQueries({ queryKey: ['threadCounts'] });

      const previousEmails = queryClient.getQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
      );
      const previousThread = queryClient.getQueryData<Email[]>([
        'thread',
        threadId,
      ]);
      const previousThreadCounts = queryClient.getQueryData<
        Record<string, number>
      >(['threadCounts']);

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

      queryClient.setQueryData(['thread', threadId], []);

      if (previousThreadCounts) {
        const newCounts = { ...previousThreadCounts };
        delete newCounts[threadId];
        queryClient.setQueryData(['threadCounts'], newCounts);
      }

      return { previousEmails, previousThread, previousThreadCounts };
    },
    onError: (_err, threadId, context) => {
      if (context?.previousEmails) {
        context.previousEmails.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousThread) {
        queryClient.setQueryData(['thread', threadId], context.previousThread);
      }
      if (context?.previousThreadCounts) {
        queryClient.setQueryData(
          ['threadCounts'],
          context.previousThreadCounts,
        );
      }
    },
    onSettled: (_data, _error, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['threadCounts'] });
    },
  });
}
