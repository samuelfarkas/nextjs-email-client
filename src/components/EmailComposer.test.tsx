import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmailComposer from './EmailComposer';
import {
  composerIdsAtom,
  composersMapAtom,
  ComposerData,
} from '@/store/composers';

// Mock useSendEmail hook
const mockMutate = jest.fn();
jest.mock('../hooks/useSendEmail', () => ({
  useSendEmail: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Create test wrapper with Jotai provider and QueryClient
function createTestWrapper(store: ReturnType<typeof createStore>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    );
  };
}

// Helper to set up composer state
function setupComposerStore(initialData: Partial<ComposerData> = {}) {
  const store = createStore();
  const composerId = 'test-composer-id';
  const composerData: ComposerData = {
    id: composerId,
    isMinimized: false,
    isFullscreen: false,
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    content: '',
    ...initialData,
  };

  store.set(composerIdsAtom, [composerId]);
  store.set(composersMapAtom, new Map([[composerId, composerData]]));

  return { store, composerId };
}

describe('EmailComposer', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  describe('Form Fields', () => {
    it('renders all form fields', () => {
      const { store, composerId } = setupComposerStore();
      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      expect(screen.getByPlaceholderText('Recipient')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Subject')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Compose email')).toBeInTheDocument();
    });

    it('updates subject field when typing', async () => {
      const { store, composerId } = setupComposerStore();
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const subjectInput = screen.getByPlaceholderText('Subject');
      await user.type(subjectInput, 'Test Subject');

      expect(subjectInput).toHaveValue('Test Subject');
    });

    it('updates content field when typing', async () => {
      const { store, composerId } = setupComposerStore();
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const contentInput = screen.getByPlaceholderText('Compose email');
      await user.type(contentInput, 'Email body content');

      expect(contentInput).toHaveValue('Email body content');
    });
  });

  describe('Cc/Bcc Toggle', () => {
    it('Cc Bcc toggle button shows "Cc Bcc" when fields are collapsed', () => {
      const { store, composerId } = setupComposerStore();
      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      // The toggle button should show "Cc Bcc" when fields are hidden
      expect(
        screen.getByRole('button', { name: /cc bcc/i }),
      ).toBeInTheDocument();
    });

    it('shows "Hide" button when Cc/Bcc fields are expanded', async () => {
      const { store, composerId } = setupComposerStore();
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const toggleButton = screen.getByRole('button', { name: /cc bcc/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /hide/i }),
        ).toBeInTheDocument();
      });
    });

    it('toggles back to "Cc Bcc" when Hide is clicked', async () => {
      const { store, composerId } = setupComposerStore();
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      // First expand
      const toggleButton = screen.getByRole('button', { name: /cc bcc/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /hide/i }),
        ).toBeInTheDocument();
      });

      // Then collapse
      const hideButton = screen.getByRole('button', { name: /hide/i });
      await user.click(hideButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cc bcc/i }),
        ).toBeInTheDocument();
      });
    });

    it('shows Cc/Bcc fields automatically when composer has cc or bcc data', () => {
      const { store, composerId } = setupComposerStore({
        cc: ['cc@example.com'],
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      // When cc/bcc data exists, the Hide button should be shown
      expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
    });
  });

  describe('Send Button State', () => {
    it('Send button is disabled when To field is empty', () => {
      const { store, composerId } = setupComposerStore({
        subject: 'Test Subject',
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('Send button is disabled when Subject field is empty', () => {
      const { store, composerId } = setupComposerStore({
        to: ['test@example.com'],
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('Send button is enabled when both To and Subject are filled', () => {
      const { store, composerId } = setupComposerStore({
        to: ['test@example.com'],
        subject: 'Test Subject',
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Email Submission', () => {
    it('calls sendEmail.mutate with correct data when Send is clicked', async () => {
      const { store, composerId } = setupComposerStore({
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        content: 'Test content',
      });
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith(
        {
          to: 'recipient@example.com',
          cc: undefined,
          bcc: undefined,
          subject: 'Test Subject',
          content: 'Test content',
          threadId: undefined,
        },
        expect.any(Object),
      );
    });

    it('includes cc and bcc in submission when provided', async () => {
      const { store, composerId } = setupComposerStore({
        to: ['recipient@example.com'],
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test Subject',
        content: 'Test content',
      });
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith(
        {
          to: 'recipient@example.com',
          cc: 'cc1@example.com, cc2@example.com',
          bcc: 'bcc@example.com',
          subject: 'Test Subject',
          content: 'Test content',
          threadId: undefined,
        },
        expect.any(Object),
      );
    });

    it('includes threadId when replying to a thread', async () => {
      const { store, composerId } = setupComposerStore({
        to: ['recipient@example.com'],
        subject: 'Re: Test Subject',
        content: 'Reply content',
        threadId: 'existing-thread-id',
      });
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          threadId: 'existing-thread-id',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Header Display', () => {
    it('displays "New Message" when subject is empty', () => {
      const { store, composerId } = setupComposerStore({
        subject: '',
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      expect(screen.getByText('New Message')).toBeInTheDocument();
    });

    it('displays subject in header when provided', () => {
      const { store, composerId } = setupComposerStore({
        subject: 'My Email Subject',
      });

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      expect(screen.getByText('My Email Subject')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('closes the composer when close button is clicked', async () => {
      const { store, composerId } = setupComposerStore();
      const user = userEvent.setup();

      render(<EmailComposer composerId={composerId} />, {
        wrapper: createTestWrapper(store),
      });

      // Find the close button (last IconButton in header)
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(
        (btn) => btn.querySelector('[data-testid="CloseIcon"]') !== null,
      );

      if (closeButton) {
        await user.click(closeButton);
      }

      // Verify the composer is removed from the store
      await waitFor(() => {
        expect(store.get(composerIdsAtom)).toHaveLength(0);
      });
    });
  });
});
