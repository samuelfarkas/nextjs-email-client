import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

interface UseEmailsParams {
  search?: string;
  filter?: string;
  threadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

async function fetchEmails(
  params: UseEmailsParams,
): Promise<PaginatedResult<Email>> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.filter) {
    searchParams.set('filter', params.filter);
  }
  if (params.threadOnly) {
    searchParams.set('threadOnly', 'true');
  }
  if (params.page !== undefined) {
    searchParams.set('page', params.page.toString());
  }
  if (params.pageSize !== undefined) {
    searchParams.set('pageSize', params.pageSize.toString());
  }

  const response = await fetch(`/api/emails?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch emails');
  }

  return response.json();
}

export function useEmails(
  params: UseEmailsParams = {},
  initialData?: PaginatedResult<Email>,
) {
  // Only use initialData for the first page, matching pageSize, and when not searching
  // (server data was fetched without search parameter)
  const shouldUseInitialData =
    initialData &&
    !params.search &&
    (params.page === undefined || params.page === 0) &&
    (params.pageSize === undefined ||
      params.pageSize === initialData.pagination.pageSize);

  return useQuery({
    queryKey: [
      'emails',
      params.search,
      params.filter,
      params.threadOnly,
      params.page ?? 0,
      params.pageSize ?? 20,
    ],
    queryFn: () => fetchEmails(params),
    placeholderData: keepPreviousData,
    initialData: shouldUseInitialData ? initialData : undefined,
  });
}
