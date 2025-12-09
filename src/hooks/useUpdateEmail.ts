import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

interface UpdateEmailData {
  id: number;
  isRead?: boolean;
  isImportant?: boolean;
}

async function updateEmail(data: UpdateEmailData): Promise<Email> {
  const { id, ...updates } = data;
  const response = await fetch(`/api/emails/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update email');
  }

  return response.json();
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmail,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['emails'] });
      await queryClient.cancelQueries({ queryKey: ['thread'] });

      const previousEmails = queryClient.getQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
      );
      const previousThreads = queryClient.getQueriesData<Email[]>({
        queryKey: ['thread'],
      });

      // Find the threadId of the email being updated from any cache
      let targetThreadId: string | null = null;
      for (const [, emails] of previousThreads) {
        const found = emails?.find((e) => e.id === data.id);
        if (found) {
          targetThreadId = found.threadId;
          break;
        }
      }
      if (!targetThreadId) {
        for (const [, result] of previousEmails) {
          if (result?.data) {
            const found = result.data.find((e) => e.id === data.id);
            if (found) {
              targetThreadId = found.threadId;
              break;
            }
          }
        }
      }

      // Update thread cache by email id (individual emails)
      const updateThreadFn = (old: Email[] | undefined) =>
        old?.map((email) =>
          email.id === data.id
            ? {
                ...email,
                ...(typeof data.isRead === 'boolean'
                  ? { isRead: data.isRead }
                  : {}),
                ...(typeof data.isImportant === 'boolean'
                  ? { isImportant: data.isImportant }
                  : {}),
              }
            : email,
        );

      // Update emails cache by threadId (thread list shows aggregated importance)
      // Only set to true optimistically; setting to false requires server to determine if other emails are important
      const updateEmailsFn = (old: PaginatedResult<Email> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((email) => {
            if (
              email.id === data.id ||
              (targetThreadId && email.threadId === targetThreadId)
            ) {
              return {
                ...email,
                ...(typeof data.isRead === 'boolean'
                  ? { isRead: data.isRead }
                  : {}),
                ...(typeof data.isImportant === 'boolean' &&
                data.isImportant === true
                  ? { isImportant: true }
                  : {}),
              };
            }
            return email;
          }),
        };
      };

      queryClient.setQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
        updateEmailsFn,
      );
      queryClient.setQueriesData<Email[]>(
        { queryKey: ['thread'] },
        updateThreadFn,
      );

      return { previousEmails, previousThreads };
    },
    onError: (_err, _data, context) => {
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}
