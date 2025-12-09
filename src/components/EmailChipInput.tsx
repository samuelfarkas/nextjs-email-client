'use client';

import {
  useState,
  KeyboardEvent,
  useRef,
  useImperativeHandle,
  Ref,
} from 'react';
import { Box, Chip, InputBase } from '@mui/material';
import { isValidEmail } from '@/utils';

export interface EmailChipInputRef {
  focus: () => void;
  commitInput: () => string | null;
}

interface EmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  maxEmails?: number;
  ref?: Ref<EmailChipInputRef>;
}

function EmailChipInput({
  value,
  onChange,
  placeholder,
  maxEmails,
  ref,
}: EmailChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = maxEmails === undefined || value.length < maxEmails;

  const addEmail = (email: string): boolean => {
    const trimmed = email.trim();
    if (
      trimmed &&
      isValidEmail(trimmed) &&
      !value.includes(trimmed) &&
      canAddMore
    ) {
      onChange([...value, trimmed]);
      setInputValue('');
      return true;
    }
    return false;
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    commitInput: () => {
      const trimmed = inputValue.trim();
      if (
        trimmed &&
        isValidEmail(trimmed) &&
        !value.includes(trimmed) &&
        canAddMore
      ) {
        addEmail(inputValue);
        return trimmed;
      }
      return null;
    },
  }));

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      if (inputValue.trim()) {
        e.preventDefault();
        addEmail(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const lastEmail = value[value.length - 1];
      if (lastEmail) {
        removeEmail(lastEmail);
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Box
      onClick={handleContainerClick}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        flex: 1,
        cursor: 'text',
        minHeight: 32,
      }}
    >
      {value.map((email) => (
        <Chip
          key={email}
          label={email}
          size="small"
          onDelete={() => removeEmail(email)}
          data-testid={`email-chip-${email}`}
          sx={{
            height: 24,
            fontSize: '0.8rem',
          }}
        />
      ))}
      {canAddMore && (
        <InputBase
          inputRef={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          sx={{
            flex: 1,
            minWidth: 100,
            '& input': {
              py: 0.5,
              fontSize: '0.875rem',
            },
          }}
        />
      )}
    </Box>
  );
}

export default EmailChipInput;
