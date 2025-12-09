import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

async function deleteEmail(emailId: number): Promise<void> {
  const response = await fetch(`/api/emails/${emailId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete email');
  }
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmail,
    onMutate: async (emailId) => {
      // Cancel all email-related queries
      await queryClient.cancelQueries({ queryKey: ['emails'] });
      await queryClient.cancelQueries({ queryKey: ['thread'] });
      await queryClient.cancelQueries({ queryKey: ['threadCounts'] });

      // Snapshot all previous values
      const previousEmails = queryClient.getQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
      );
      const previousThreads = queryClient.getQueriesData<Email[]>({
        queryKey: ['thread'],
      });
      const previousThreadCounts = queryClient.getQueryData<
        Record<string, number>
      >(['threadCounts']);

      // Find the email to get its threadId for thread-based filtering
      let deletedEmail: Email | undefined;
      previousEmails.forEach(([, result]) => {
        if (result?.data) {
          const found = result.data.find((email) => email.id === emailId);
          if (found) deletedEmail = found;
        }
      });

      // Optimistically remove the email from all email list queries
      queryClient.setQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((email) => email.id !== emailId),
          };
        },
      );

      // Also update any thread queries that might contain this email
      if (deletedEmail) {
        queryClient.setQueriesData<Email[]>({ queryKey: ['thread'] }, (old) => {
          if (!old) return old;
          return old.filter((email) => email.id !== emailId);
        });

        // Update thread counts
        if (previousThreadCounts && deletedEmail.threadId) {
          const newCounts = { ...previousThreadCounts };
          const currentCount = newCounts[deletedEmail.threadId];
          if (currentCount !== undefined && currentCount > 0) {
            const updatedCount = currentCount - 1;
            if (updatedCount <= 0) {
              delete newCounts[deletedEmail.threadId];
            } else {
              newCounts[deletedEmail.threadId] = updatedCount;
            }
          }
          queryClient.setQueryData(['threadCounts'], newCounts);
        }
      }

      return { previousEmails, previousThreads, previousThreadCounts };
    },
    onError: (_err, _emailId, context) => {
      // Rollback on error
      if (context?.previousEmails) {
        context.previousEmails.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousThreads) {
        context.previousThreads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousThreadCounts) {
        queryClient.setQueryData(
          ['threadCounts'],
          context.previousThreadCounts,
        );
      }
    },
    onSettled: () => {
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
      queryClient.invalidateQueries({ queryKey: ['threadCounts'] });
    },
  });
}
