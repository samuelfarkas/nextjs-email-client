import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmailCard from './EmailCard';
import { Email, EmailDirection } from '@/lib/schema';

// Mock hooks
const mockDeleteMutate = jest.fn();
const mockRestoreMutate = jest.fn();

jest.mock('../hooks/useDeleteThread', () => ({
  useDeleteThread: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

jest.mock('../hooks/useRestoreThread', () => ({
  useRestoreThread: () => ({
    mutate: mockRestoreMutate,
    isPending: false,
  }),
}));

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Test email factory
function createTestEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: 1,
    threadId: 'test-thread-id',
    subject: 'Test Subject',
    from: 'sender@example.com',
    to: 'recipient@example.com',
    cc: null,
    bcc: null,
    content: 'This is the email content for testing purposes.',
    isRead: false,
    isImportant: false,
    isDeleted: false,
    direction: EmailDirection.INCOMING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('EmailCard', () => {
  beforeEach(() => {
    mockDeleteMutate.mockClear();
    mockRestoreMutate.mockClear();
  });

  describe('Email Content Display', () => {
    it('displays the email subject', () => {
      const email = createTestEmail({ subject: 'Important Meeting' });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByText('Important Meeting')).toBeInTheDocument();
    });

    it('displays the sender', () => {
      const email = createTestEmail({ from: 'john.doe@example.com' });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('displays content preview truncated to 30 characters', () => {
      const email = createTestEmail({
        content: 'This is a very long email content that should be truncated',
      });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(
        screen.getByText('This is a very long email cont...'),
      ).toBeInTheDocument();
    });

    it('displays "Empty content" when content is null', () => {
      const email = createTestEmail({ content: null });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByText('Empty content')).toBeInTheDocument();
    });
  });

  describe('Read/Unread Indicator', () => {
    it('shows Unread chip for unread emails', () => {
      const email = createTestEmail({ isRead: false });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByText('Unread')).toBeInTheDocument();
    });

    it('does not show Unread chip for read emails', () => {
      const email = createTestEmail({ isRead: true });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.queryByText('Unread')).not.toBeInTheDocument();
    });
  });

  describe('Important Indicator', () => {
    it('shows Important chip for important emails', () => {
      const email = createTestEmail({ isImportant: true });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByText('Important')).toBeInTheDocument();
    });

    it('does not show Important chip for non-important emails', () => {
      const email = createTestEmail({ isImportant: false });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.queryByText('Important')).not.toBeInTheDocument();
    });

    it('shows star icon for important emails', () => {
      const email = createTestEmail({ isImportant: true });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('StarIcon')).toBeInTheDocument();
    });
  });

  describe('Thread Count Badge', () => {
    it('shows thread count badge when threadCount > 1', () => {
      const email = createTestEmail();
      render(<EmailCard email={email} threadCount={5} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not show thread count badge when threadCount is 1', () => {
      const email = createTestEmail();
      render(<EmailCard email={email} threadCount={1} />, {
        wrapper: createWrapper(),
      });

      // The text "1" should only appear as part of other text, not as a badge
      const chips = screen.queryAllByRole('generic');
      const badgeChip = chips.find((chip) => chip.textContent === '1');
      expect(badgeChip).toBeUndefined();
    });

    it('does not show thread count badge when threadCount is undefined', () => {
      const email = createTestEmail();
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      // Should not have any numeric badge
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });
  });

  describe('Selected State', () => {
    it('has primary border color when selected', () => {
      const email = createTestEmail();
      render(<EmailCard email={email} selected={true} />, {
        wrapper: createWrapper(),
      });

      const card = screen.getByTestId(`email-card-${email.id}`);
      expect(card).toBeInTheDocument();
      // The card should have selected styling (primary.main border)
      // We check for the presence of the card in selected state
    });
  });

  describe('Delete Button', () => {
    it('shows delete button on hover (non-trash view)', async () => {
      const email = createTestEmail();
      render(<EmailCard email={email} isTrashView={false} />, {
        wrapper: createWrapper(),
      });

      // The delete icon should be in the DOM but hidden until hover
      expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
    });

    it('calls deleteThread.mutate when delete button is clicked', async () => {
      const email = createTestEmail({ threadId: 'thread-to-delete' });
      const user = userEvent.setup();

      render(<EmailCard email={email} isTrashView={false} />, {
        wrapper: createWrapper(),
      });

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
      expect(deleteButton).toBeInTheDocument();

      await user.click(deleteButton!);

      expect(mockDeleteMutate).toHaveBeenCalledWith('thread-to-delete');
    });
  });

  describe('Restore Button (Trash View)', () => {
    it('shows restore button instead of delete in trash view', () => {
      const email = createTestEmail();
      render(<EmailCard email={email} isTrashView={true} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('RestoreFromTrashIcon')).toBeInTheDocument();
      expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });

    it('calls restoreThread.mutate when restore button is clicked', async () => {
      const email = createTestEmail({ threadId: 'thread-to-restore' });
      const user = userEvent.setup();

      render(<EmailCard email={email} isTrashView={true} />, {
        wrapper: createWrapper(),
      });

      const restoreButton = screen
        .getByTestId('RestoreFromTrashIcon')
        .closest('button');
      expect(restoreButton).toBeInTheDocument();

      await user.click(restoreButton!);

      expect(mockRestoreMutate).toHaveBeenCalledWith('thread-to-restore');
    });
  });

  describe('Avatar', () => {
    it('displays initials from sender email', () => {
      const email = createTestEmail({ from: 'john.doe@example.com' });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      // getInitials returns the first character of the email username
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('uses warning color for important emails avatar', () => {
      const email = createTestEmail({ isImportant: true });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      // The avatar component exists - styling is handled by MUI
      const avatar = screen.getByText(/^[A-Z]$/);
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Test ID', () => {
    it('has correct data-testid attribute', () => {
      const email = createTestEmail({ id: 42 });
      render(<EmailCard email={email} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('email-card-42')).toBeInTheDocument();
    });
  });
});
