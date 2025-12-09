import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import { createStore } from 'jotai';
import Sidebar from './Sidebar';
import {
  composerIdsAtom,
  composersMapAtom,
  MAX_COMPOSERS,
} from '@/store/composers';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Create test wrapper with Jotai provider
function createTestWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    // Reset search params before each test
    mockSearchParams.delete('filter');
  });

  describe('Compose Button', () => {
    it('renders the Compose button', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      expect(
        screen.getByRole('button', { name: /compose/i }),
      ).toBeInTheDocument();
    });

    it('Compose button is enabled when fewer than MAX_COMPOSERS are open', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const composeButton = screen.getByRole('button', { name: /compose/i });
      expect(composeButton).not.toBeDisabled();
    });

    it('Compose button is disabled when MAX_COMPOSERS are already open', () => {
      const store = createStore();

      // Fill up the composers to max
      const ids = Array.from(
        { length: MAX_COMPOSERS },
        (_, i) => `composer-${i}`,
      );
      const map = new Map();
      ids.forEach((id) => {
        map.set(id, {
          id,
          isMinimized: false,
          isFullscreen: false,
          to: [],
          cc: [],
          bcc: [],
          subject: '',
          content: '',
        });
      });
      store.set(composerIdsAtom, ids);
      store.set(composersMapAtom, map);

      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const composeButton = screen.getByRole('button', { name: /compose/i });
      expect(composeButton).toBeDisabled();
    });

    it('opens a new composer when Compose button is clicked', async () => {
      const store = createStore();
      const user = userEvent.setup();

      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      expect(store.get(composerIdsAtom)).toHaveLength(0);

      const composeButton = screen.getByRole('button', { name: /compose/i });
      await user.click(composeButton);

      await waitFor(() => {
        expect(store.get(composerIdsAtom)).toHaveLength(1);
      });
    });
  });

  describe('Filter Menu Items', () => {
    it('renders all filter options', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      expect(screen.getByText('Inbox')).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
      expect(screen.getByText('Trash')).toBeInTheDocument();
    });

    it('Inbox link has correct href', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const inboxLink = screen.getByText('Inbox').closest('a');
      expect(inboxLink).toHaveAttribute('href', '/');
    });

    it('Important link has correct href', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const importantLink = screen.getByText('Important').closest('a');
      expect(importantLink).toHaveAttribute('href', '/?filter=important');
    });

    it('Sent link has correct href', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const sentLink = screen.getByText('Sent').closest('a');
      expect(sentLink).toHaveAttribute('href', '/?filter=sent');
    });

    it('Trash link has correct href', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const trashLink = screen.getByText('Trash').closest('a');
      expect(trashLink).toHaveAttribute('href', '/?filter=trash');
    });
  });

  describe('Filter Selection State', () => {
    it('Inbox is selected by default (no filter param)', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const inboxItem = screen.getByRole('menuitem', { name: /inbox/i });
      expect(inboxItem).toHaveAttribute('data-selected', 'true');
    });

    it('Important is selected when filter=important', () => {
      mockSearchParams.set('filter', 'important');
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const importantItem = screen.getByRole('menuitem', {
        name: /important/i,
      });
      expect(importantItem).toHaveAttribute('data-selected', 'true');
    });

    it('Sent is selected when filter=sent', () => {
      mockSearchParams.set('filter', 'sent');
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const sentItem = screen.getByRole('menuitem', { name: /^sent$/i });
      expect(sentItem).toHaveAttribute('data-selected', 'true');
    });

    it('Trash is selected when filter=trash', () => {
      mockSearchParams.set('filter', 'trash');
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      const trashItem = screen.getByRole('menuitem', { name: /trash/i });
      expect(trashItem).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Icons', () => {
    it('displays the correct icon for each filter', () => {
      const store = createStore();
      render(<Sidebar />, { wrapper: createTestWrapper(store) });

      expect(screen.getByTestId('InboxIcon')).toBeInTheDocument();
      expect(screen.getByTestId('StarIcon')).toBeInTheDocument();
      expect(screen.getByTestId('SendIcon')).toBeInTheDocument();
      expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
    });
  });
});
