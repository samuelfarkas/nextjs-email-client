import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import ThreadViewClient from './ThreadViewClient';
import { emailData } from '../../../../../database/seed';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Create a wrapper with QueryClientProvider and JotaiProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </JotaiProvider>
    );
  }
  return Wrapper;
};

// Get emails for thread-001 (5 emails)
const thread001Emails = emailData
  .filter((email) => email.threadId === 'thread-001')
  .sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

describe('ThreadViewClient', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('Displays full email content for the last message (auto-expanded)', async () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={false}
        filter={undefined}
      />,
      { wrapper: createWrapper() },
    );

    // The last email in thread-001 is from david.kim@company.com with content:
    // "Friday works for me. Looking forward to the discussion!"
    const lastEmail = thread001Emails[thread001Emails.length - 1];

    // Full content should be visible since last message is auto-expanded
    expect(screen.getByText(lastEmail.content || '')).toBeInTheDocument();
  });

  test('Shows message count chip for threads with multiple messages', async () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={false}
        filter={undefined}
      />,
      { wrapper: createWrapper() },
    );

    // Should show "{n} messages" chip based on actual email count
    expect(
      screen.getByText(`${thread001Emails.length} messages`),
    ).toBeInTheDocument();
  });

  test('Expand/collapse messages work correctly', async () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={false}
        filter={undefined}
      />,
      { wrapper: createWrapper() },
    );

    // Get the first email (collapsed by default)
    const firstEmail = thread001Emails[0];
    const fullContent = firstEmail.content || '';

    // Click on the expand icon to expand the first message
    // The expand icons are ExpandMoreIcon (collapsed) and ExpandLessIcon (expanded)
    const expandIcons = screen.getAllByTestId('ExpandMoreIcon');
    expect(expandIcons.length).toBeGreaterThan(0);

    const user = userEvent.setup();
    // Click on the clickable header row
    const clickableRow = expandIcons[0].closest(
      '[data-testid="thread-message-header"]',
    );
    if (clickableRow) {
      await user.click(clickableRow);
    }

    // After expanding, the full content should be visible (may appear multiple times)
    const contentElements = screen.getAllByText(fullContent);
    expect(contentElements.length).toBeGreaterThan(0);
  });

  test('Shows subject in the header', () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={false}
        filter={undefined}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('New Project Proposal')).toBeInTheDocument();
  });

  test('Shows Delete button in normal view', () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={false}
        filter={undefined}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('Shows Restore button in trash view', () => {
    render(
      <ThreadViewClient
        threadId="thread-001"
        subject="New Project Proposal"
        initialEmails={thread001Emails}
        isTrashView={true}
        filter="trash"
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByRole('button', { name: /restore/i }),
    ).toBeInTheDocument();
  });
});
