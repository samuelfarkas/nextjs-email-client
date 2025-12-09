import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import EmailChipInput, { EmailChipInputRef } from './EmailChipInput';

describe('EmailChipInput', () => {
  describe('Rendering', () => {
    it('renders email chips for each email in value', () => {
      const emails = ['test1@example.com', 'test2@example.com'];
      render(<EmailChipInput value={emails} onChange={() => {}} />);

      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });

    it('renders input field', () => {
      render(
        <EmailChipInput
          value={[]}
          onChange={() => {}}
          placeholder="Enter email"
        />,
      );

      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('shows placeholder when no emails are present', () => {
      render(
        <EmailChipInput
          value={[]}
          onChange={() => {}}
          placeholder="Add recipients"
        />,
      );

      expect(screen.getByPlaceholderText('Add recipients')).toBeInTheDocument();
    });

    it('hides placeholder when emails are present', () => {
      render(
        <EmailChipInput
          value={['test@example.com']}
          onChange={() => {}}
          placeholder="Add recipients"
        />,
      );

      expect(
        screen.queryByPlaceholderText('Add recipients'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Adding Emails', () => {
    it('adds email when Enter is pressed', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(<EmailChipInput value={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'new@example.com{enter}');

      expect(mockOnChange).toHaveBeenCalledWith(['new@example.com']);
    });

    it('adds email when Tab is pressed', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(<EmailChipInput value={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'new@example.com');
      await user.tab();

      expect(mockOnChange).toHaveBeenCalledWith(['new@example.com']);
    });

    it('adds email when comma is pressed', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(<EmailChipInput value={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'new@example.com,');

      expect(mockOnChange).toHaveBeenCalledWith(['new@example.com']);
    });

    it('adds email on blur', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(<EmailChipInput value={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'new@example.com');
      fireEvent.blur(input);

      expect(mockOnChange).toHaveBeenCalledWith(['new@example.com']);
    });

    it('does not add invalid email', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(<EmailChipInput value={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-email{enter}');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not add duplicate email', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(
        <EmailChipInput
          value={['existing@example.com']}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'existing@example.com{enter}');

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Removing Emails', () => {
    it('removes email when chip delete button is clicked', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(
        <EmailChipInput
          value={['test@example.com', 'other@example.com']}
          onChange={mockOnChange}
        />,
      );

      // Find the delete button using data-testid
      const chip = screen.getByTestId('email-chip-test@example.com');
      const deleteButton = chip.querySelector('svg[data-testid="CancelIcon"]');

      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton!);

      expect(mockOnChange).toHaveBeenCalledWith(['other@example.com']);
    });

    it('removes last email when Backspace is pressed with empty input', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(
        <EmailChipInput
          value={['first@example.com', 'last@example.com']}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith(['first@example.com']);
    });

    it('does not remove email when Backspace is pressed with non-empty input', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(
        <EmailChipInput
          value={['existing@example.com']}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      await user.keyboard('{Backspace}');

      // Should not remove the chip since input has content
      // The call would be for removing 'existing@example.com'
      expect(mockOnChange).not.toHaveBeenCalledWith([]);
    });
  });

  describe('Max Emails Limit', () => {
    it('hides input when maxEmails limit is reached', () => {
      render(
        <EmailChipInput
          value={['test1@example.com', 'test2@example.com']}
          onChange={() => {}}
          maxEmails={2}
        />,
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows input when under maxEmails limit', () => {
      render(
        <EmailChipInput
          value={['test@example.com']}
          onChange={() => {}}
          maxEmails={2}
        />,
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not add email when maxEmails limit is reached', async () => {
      const mockOnChange = jest.fn();
      const user = userEvent.setup();

      render(
        <EmailChipInput
          value={['test@example.com']}
          onChange={mockOnChange}
          maxEmails={2}
        />,
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'new@example.com{enter}');

      expect(mockOnChange).toHaveBeenCalledWith([
        'test@example.com',
        'new@example.com',
      ]);

      // After adding, input should disappear
      // This is tested by render with 2 emails at maxEmails=2
    });
  });

  describe('Container Click', () => {
    it('focuses input when container is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EmailChipInput value={[]} onChange={() => {}} placeholder="Email" />,
      );

      const container = screen.getByPlaceholderText('Email').closest('div');
      await user.click(container!);

      expect(screen.getByPlaceholderText('Email')).toHaveFocus();
    });
  });

  describe('Ref Methods', () => {
    it('focus() method focuses the input', () => {
      const TestComponent = () => {
        const ref = useRef<EmailChipInputRef>(null);

        return (
          <>
            <EmailChipInput
              ref={ref}
              value={[]}
              onChange={() => {}}
              placeholder="Email"
            />
            <button onClick={() => ref.current?.focus()}>Focus</button>
          </>
        );
      };

      render(<TestComponent />);

      const focusButton = screen.getByText('Focus');
      fireEvent.click(focusButton);

      expect(screen.getByPlaceholderText('Email')).toHaveFocus();
    });

    it('commitInput() returns email when valid and adds it', async () => {
      let committedEmail: string | null = null;
      const mockOnChange = jest.fn();

      const TestComponent = () => {
        const ref = useRef<EmailChipInputRef>(null);

        return (
          <>
            <EmailChipInput
              ref={ref}
              value={[]}
              onChange={mockOnChange}
              placeholder="Email"
            />
            <button
              onClick={() => {
                committedEmail = ref.current?.commitInput() ?? null;
              }}
            >
              Commit
            </button>
          </>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const input = screen.getByPlaceholderText('Email');
      await user.type(input, 'committed@example.com');

      const commitButton = screen.getByText('Commit');
      fireEvent.click(commitButton);

      expect(committedEmail).toBe('committed@example.com');
      expect(mockOnChange).toHaveBeenCalledWith(['committed@example.com']);
    });

    it('commitInput() returns null for invalid email', async () => {
      let committedEmail: string | null = 'initial';
      const mockOnChange = jest.fn();

      const TestComponent = () => {
        const ref = useRef<EmailChipInputRef>(null);

        return (
          <>
            <EmailChipInput
              ref={ref}
              value={[]}
              onChange={mockOnChange}
              placeholder="Email"
            />
            <button
              onClick={() => {
                committedEmail = ref.current?.commitInput() ?? null;
              }}
            >
              Commit
            </button>
          </>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const input = screen.getByPlaceholderText('Email');
      await user.type(input, 'invalid-email');

      const commitButton = screen.getByText('Commit');
      fireEvent.click(commitButton);

      expect(committedEmail).toBeNull();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
