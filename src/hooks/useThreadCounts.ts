import { useQuery } from '@tanstack/react-query';

async function fetchThreadCounts(): Promise<Record<string, number>> {
  const response = await fetch('/api/emails/threads');

  if (!response.ok) {
    throw new Error('Failed to fetch thread counts');
  }

  return response.json();
}

export function useThreadCounts(initialData?: Record<string, number>) {
  return useQuery({
    queryKey: ['threadCounts'],
    queryFn: fetchThreadCounts,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    initialData,
  });
}
