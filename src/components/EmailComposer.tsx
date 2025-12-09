'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Button,
  Collapse,
  Dialog,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  OpenInFull as MaximizeIcon,
  Send as SendIcon,
  // OpenInNew as OpenInNewIcon,
  // CloseFullscreen as CloseFullscreenIcon,
} from '@mui/icons-material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSendEmail } from '@/hooks/useSendEmail';
import {
  composerAtomFamily,
  updateComposerAtom,
  closeComposerAtom,
  toggleMinimizeAtom,
  // toggleFullscreenAtom,
  clearBumpAtom,
} from '@/store/composers';
import EmailChipInput, { EmailChipInputRef } from './EmailChipInput';
import { useOnMount } from '@/hooks/useOnMount';

interface EmailComposerProps {
  composerId: string;
}

export default function EmailComposer({ composerId }: EmailComposerProps) {
  const [showCcBcc, setShowCcBcc] = useState(false);
  const sendEmail = useSendEmail();
  const toInputRef = useRef<EmailChipInputRef>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const composerAtom = useMemo(
    () => composerAtomFamily(composerId),
    [composerId],
  );
  const composer = useAtomValue(composerAtom);
  const updateComposer = useSetAtom(updateComposerAtom);
  const closeComposer = useSetAtom(closeComposerAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  // const toggleFullscreen = useSetAtom(toggleFullscreenAtom);
  const clearBump = useSetAtom(clearBumpAtom);

  useOnMount(() => {
    if (composer && !composer.isMinimized) {
      // If to is already filled (e.g., from Reply), focus content field instead
      if (composer.to.length > 0) {
        contentInputRef.current?.focus();
      } else {
        toInputRef.current?.focus();
      }
      if (composer.cc.length > 0 || composer.bcc.length > 0) {
        setShowCcBcc(true);
      }
    }
  });

  // Clear bump animation after it completes
  useEffect(() => {
    if (composer?.shouldBump) {
      const timer = setTimeout(() => {
        clearBump(composerId);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [composer?.shouldBump, composerId, clearBump]);

  if (!composer) {
    return null;
  }

  const handleSend = () => {
    const pendingEmail = toInputRef.current?.commitInput();

    const toRecipient = pendingEmail || composer.to[0];

    if (!toRecipient || !composer.subject) {
      return;
    }

    sendEmail.mutate(
      {
        to: toRecipient,
        cc: composer.cc.length > 0 ? composer.cc.join(', ') : undefined,
        bcc: composer.bcc.length > 0 ? composer.bcc.join(', ') : undefined,
        subject: composer.subject,
        content: composer.content || undefined,
        threadId: composer.threadId,
      },
      {
        onSuccess: () => {
          closeComposer(composerId);
        },
      },
    );
  };

  const handleToggleMinimize = () => {
    toggleMinimize(composerId);
  };

  const handleFieldChange = (field: string, value: string | string[]) => {
    updateComposer({ id: composerId, updates: { [field]: value } });
  };

  const handleClose = () => {
    closeComposer(composerId);
  };

  // const handleToggleFullscreen = () => {
  //   toggleFullscreen(composerId);
  // };

  const formFields = (
    <>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 40, pt: 0.5 }}
          >
            To
          </Typography>
          <EmailChipInput
            ref={toInputRef}
            value={composer.to}
            onChange={(emails) => handleFieldChange('to', emails)}
            placeholder="Recipient"
            maxEmails={1}
          />
          <Button
            size="small"
            onClick={() => setShowCcBcc(!showCcBcc)}
            sx={{ textTransform: 'none', minWidth: 'auto' }}
          >
            {showCcBcc ? 'Hide' : 'Cc Bcc'}
          </Button>
        </Box>
      </Box>

      <Collapse in={showCcBcc}>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 40, pt: 0.5 }}
            >
              Cc
            </Typography>
            <EmailChipInput
              value={composer.cc}
              onChange={(emails) => handleFieldChange('cc', emails)}
              placeholder="Cc recipients"
            />
          </Box>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 40, pt: 0.5 }}
            >
              Bcc
            </Typography>
            <EmailChipInput
              value={composer.bcc}
              onChange={(emails) => handleFieldChange('bcc', emails)}
              placeholder="Bcc recipients"
            />
          </Box>
        </Box>
      </Collapse>

      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder="Subject"
          value={composer.subject}
          onChange={(e) => handleFieldChange('subject', e.target.value)}
          slotProps={{ input: { disableUnderline: true } }}
          sx={{ '& input': { py: 0.5 } }}
        />
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={composer.isFullscreen ? undefined : 15}
          variant="standard"
          placeholder="Compose email"
          value={composer.content}
          onChange={(e) => handleFieldChange('content', e.target.value)}
          inputRef={contentInputRef}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: {
                height: composer.isFullscreen ? '100%' : undefined,
                alignItems: 'flex-start',
              },
            },
            htmlInput: {
              style: { height: composer.isFullscreen ? '100%' : undefined },
            },
          }}
          sx={{
            flex: composer.isFullscreen ? 1 : undefined,
            '& textarea': { py: 0.5 },
          }}
        />
      </Box>
    </>
  );

  const actionBar = (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderTopColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        flexShrink: 0,
      }}
    >
      <Button
        variant="contained"
        startIcon={<SendIcon />}
        onClick={handleSend}
        disabled={
          composer.to.length === 0 || !composer.subject || sendEmail.isPending
        }
        sx={{ textTransform: 'none' }}
      >
        {sendEmail.isPending ? 'Sending...' : 'Send'}
      </Button>
    </Box>
  );

  const header = (
    <Box
      onClick={composer.isFullscreen ? undefined : handleToggleMinimize}
      sx={{
        px: 2,
        py: 1,
        backgroundColor: 'inverseSurface',
        color: 'inverseOnSurface',
        display: 'flex',
        alignItems: 'center',
        cursor: composer.isFullscreen ? 'default' : 'pointer',
        flexShrink: 0,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {composer.subject || 'New Message'}
      </Typography>

      {!composer.isFullscreen && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMinimize();
          }}
          sx={{
            color: 'inverseOnSurface',
            p: 0.5,
            '&:hover': { backgroundColor: 'action.hoverInverse' },
          }}
        >
          {composer.isMinimized ? (
            <MaximizeIcon fontSize="small" />
          ) : (
            <MinimizeIcon fontSize="small" />
          )}
        </IconButton>
      )}

      {/* <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFullscreen();
        }}
        sx={{
          color: 'inverseOnSurface',
          p: 0.5,
          ml: 0.5,
          '&:hover': { backgroundColor: 'action.hoverInverse' },
        }}
      >
        {composer.isFullscreen ? (
          <CloseFullscreenIcon fontSize="small" />
        ) : (
          <OpenInNewIcon fontSize="small" />
        )}
      </IconButton> */}

      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        sx={{
          color: 'inverseOnSurface',
          p: 0.5,
          ml: 0.5,
          '&:hover': { backgroundColor: 'action.hoverInverse' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  if (composer.isFullscreen) {
    return (
      <Dialog
        open={true}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {header}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          {formFields}
        </Box>
        {actionBar}
      </Dialog>
    );
  }

  return (
    <Card
      elevation={8}
      sx={{
        width: 800,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden',
        ...(composer.shouldBump &&
          !composer?.isMinimized && {
            animation: 'bump 0.4s ease-in-out',
            '@keyframes bump': {
              '0%': { transform: 'scale(1)' },
              '25%': { transform: 'scale(1.02)' },
              '50%': { transform: 'scale(0.98)' },
              '75%': { transform: 'scale(1.01)' },
              '100%': { transform: 'scale(1)' },
            },
          }),
      }}
    >
      {header}
      <Collapse in={!composer.isMinimized} timeout="auto" unmountOnExit>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {formFields}
          {actionBar}
        </CardContent>
      </Collapse>
    </Card>
  );
}
