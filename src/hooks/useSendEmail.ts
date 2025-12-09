import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Email, EmailDirection } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

interface SendEmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content?: string;
  threadId?: string;
}

async function sendEmail(data: SendEmailData): Promise<Email> {
  const response = await fetch('/api/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error('Send email failed:', response.status, errorBody);
    throw new Error(`Failed to send email: ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendEmail,
    onMutate: async (data) => {
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['emails'] });
      if (data.threadId) {
        await queryClient.cancelQueries({
          queryKey: ['thread', data.threadId],
        });
      }

      const previousEmails = queryClient.getQueriesData<PaginatedResult<Email>>(
        {
          queryKey: ['emails'],
        },
      );

      const previousThreadEmails = data.threadId
        ? queryClient.getQueriesData<Email[]>({
            queryKey: ['thread', data.threadId],
          })
        : [];

      // Create optimistic email
      const optimisticEmail: Email = {
        id: -Date.now(), // Temporary negative ID
        threadId: data.threadId || crypto.randomUUID(),
        subject: data.subject,
        from: 'user@example.com',
        to: data.to,
        cc: data.cc || null,
        bcc: data.bcc || null,
        content: data.content || null,
        isRead: true,
        isImportant: false,
        isDeleted: false,
        direction: EmailDirection.OUTGOING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to all email queries (emails queries store PaginatedResult)
      queryClient.setQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [optimisticEmail, ...old.data],
            pagination: { ...old.pagination, total: old.pagination.total + 1 },
          };
        },
      );

      // Add to thread query if replying to a thread (thread queries store Email[])
      if (data.threadId) {
        queryClient.setQueriesData<Email[]>(
          { queryKey: ['thread', data.threadId] },
          (old) => (old ? [...old, optimisticEmail] : [optimisticEmail]),
        );
      }

      return { previousEmails, previousThreadEmails, optimisticEmail };
    },
    onError: (_err, data, context) => {
      // Rollback email queries
      if (context?.previousEmails) {
        context.previousEmails.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      // Rollback thread queries
      if (context?.previousThreadEmails) {
        context.previousThreadEmails.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },
    onSuccess: (newEmail, data, context) => {
      // Replace optimistic email with real one in email queries (PaginatedResult)
      queryClient.setQueriesData<PaginatedResult<Email>>(
        { queryKey: ['emails'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((email) =>
              email.id === context?.optimisticEmail.id ? newEmail : email,
            ),
          };
        },
      );
      // Replace optimistic email with real one in thread query (Email[])
      if (data.threadId) {
        queryClient.setQueriesData<Email[]>(
          { queryKey: ['thread', data.threadId] },
          (old) =>
            old?.map((email) =>
              email.id === context?.optimisticEmail.id ? newEmail : email,
            ),
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      if (variables.threadId) {
        queryClient.invalidateQueries({
          queryKey: ['thread', variables.threadId],
        });
      }
    },
  });
}
