import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmailListPanel from './EmailListPanel';
import { threads, emailData } from '../../database/seed';
import { Email } from '@/lib/schema';
import { PaginatedResult } from '@/services/emailService';

// Helper to wrap email list in paginated result format
function toPaginatedResult(data: Email[]): PaginatedResult<Email> {
  return {
    data,
    pagination: {
      page: 0,
      pageSize: 20,
      total: data.length,
      totalPages: Math.ceil(data.length / 20),
      hasMore: false,
    },
  };
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe('EmailListPanel', () => {
  const emailList: Email[] = [...emailData].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/emails/threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url.includes('/api/emails')) {
        return Promise.resolve({
          ok: true,
          json: async () => toPaginatedResult(emailList),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Shows the email list in the inbox', async () => {
    render(<EmailListPanel />, { wrapper: createWrapper() });
    await screen.findByTestId('email-list');

    await waitFor(() => {
      expect(screen.getAllByText(threads[0].subject).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(threads[1].subject).length).toBeGreaterThan(0);
    expect(screen.getAllByText(threads[2].subject).length).toBeGreaterThan(0);
    expect(screen.getAllByText(threads[3].subject).length).toBeGreaterThan(0);
  });

  test('Displays the email content truncated to 30 characters', async () => {
    render(<EmailListPanel />, { wrapper: createWrapper() });
    await screen.findByTestId('email-list');

    await waitFor(() => {
      expect(
        screen.getAllByText(threads[0].content?.substring(0, 30) + '...')
          .length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getAllByText(threads[1].content?.substring(0, 30) + '...').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(threads[2].content?.substring(0, 30) + '...').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(threads[3].content?.substring(0, 30) + '...').length,
    ).toBeGreaterThan(0);
  });

  test('Clicking an email navigates to thread view', async () => {
    render(<EmailListPanel />, { wrapper: createWrapper() });
    await screen.findByTestId('email-list');

    await waitFor(() => {
      expect(
        screen.getByTestId(`email-card-${threads[0].id}`),
      ).toBeInTheDocument();
    });

    const emailCard = screen.getByTestId(`email-card-${threads[0].id}`);
    const link = emailCard.closest('a');

    expect(link).toHaveAttribute('href', `/thread/${threads[0].threadId}`);
  });

  test('The search feature works as expected', async () => {
    const searchTerm = threads[0].subject.substring(0, 5);
    const matchingEmails = emailList.filter((email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/emails/threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url.includes('/api/emails') && url.includes('search=')) {
        return Promise.resolve({
          ok: true,
          json: async () => toPaginatedResult(matchingEmails),
        });
      }
      if (url.includes('/api/emails')) {
        return Promise.resolve({
          ok: true,
          json: async () => toPaginatedResult(emailList),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<EmailListPanel />, { wrapper: createWrapper() });
    await screen.findByTestId('email-list');

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const searchInput = screen.getByPlaceholderText('Search emails...');
    await user.type(searchInput, searchTerm);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      const displayedEmails = screen.getAllByTestId(/email-card-/);
      expect(displayedEmails.length).toBeGreaterThan(0);
    });
  });

  test('The search feature is debounced and works as expected', async () => {
    const searchTerm = threads[0].subject.substring(0, 5);
    const matchingEmails = emailList.filter((email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    let searchApiCallCount = 0;

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/emails/threads')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url.includes('/api/emails') && url.includes('search=')) {
        searchApiCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => toPaginatedResult(matchingEmails),
        });
      }
      if (url.includes('/api/emails')) {
        return Promise.resolve({
          ok: true,
          json: async () => toPaginatedResult(emailList),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<EmailListPanel />, { wrapper: createWrapper() });
    await screen.findByTestId('email-list');

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const searchInput = screen.getByPlaceholderText('Search emails...');
    await user.type(searchInput, searchTerm);

    expect(searchApiCallCount).toBe(0);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(600);
    });

    await waitFor(() => {
      expect(searchApiCallCount).toBeGreaterThan(0);
    });

    const displayedEmails = screen.getAllByTestId(/email-card-/);
    expect(displayedEmails.length).toBeGreaterThan(0);
  });
});
