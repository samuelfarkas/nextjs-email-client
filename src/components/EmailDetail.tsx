'use client';

import {
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon,
  Reply as ReplyIcon,
  ReplyAll as ReplyAllIcon,
} from '@mui/icons-material';
import { useSetAtom } from 'jotai';
import { openComposerAtom } from '@/store/composers';
import { Email } from '@/lib/schema';
import { useDeleteEmail } from '@/hooks/useDeleteEmail';
import { useUpdateEmail } from '@/hooks/useUpdateEmail';
import { CURRENT_USER_EMAIL } from '@/constants';
import {
  getInitials,
  formatDateLong,
  getReplySubject,
  parseEmailList,
} from '@/utils';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
}

export default function EmailDetail({ email, onBack }: EmailDetailProps) {
  const deleteEmail = useDeleteEmail();
  const updateEmail = useUpdateEmail();
  const openComposer = useSetAtom(openComposerAtom);

  const handleDelete = () => {
    deleteEmail.mutate(email.id, {
      onSuccess: () => {
        onBack();
      },
    });
  };

  const handleToggleImportant = () => {
    updateEmail.mutate({
      id: email.id,
      isImportant: !email.isImportant,
    });
  };

  const handleToggleRead = () => {
    updateEmail.mutate({
      id: email.id,
      isRead: !email.isRead,
    });
  };

  const handleReply = () => {
    openComposer({
      to: [email.from],
      subject: getReplySubject(email.subject),
      content: undefined,
      threadId: email.threadId,
    });
  };

  const handleReplyAll = () => {
    const ccRecipients = parseEmailList(email.cc).filter(
      (e) => e.toLowerCase() !== CURRENT_USER_EMAIL.toLowerCase(),
    );
    const toRecipients = parseEmailList(email.to).filter(
      (e) => e.toLowerCase() !== CURRENT_USER_EMAIL.toLowerCase(),
    );

    openComposer({
      to: [email.from],
      cc: [...toRecipients, ...ccRecipients],
      subject: getReplySubject(email.subject),
      content: undefined,
      threadId: email.threadId,
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        <IconButton onClick={handleReply} size="small" title="Reply">
          <ReplyIcon />
        </IconButton>

        <IconButton onClick={handleReplyAll} size="small" title="Reply All">
          <ReplyAllIcon />
        </IconButton>

        <IconButton
          onClick={handleToggleRead}
          size="small"
          title={email.isRead ? 'Mark as unread' : 'Mark as read'}
        >
          {email.isRead ? <MarkUnreadIcon /> : <MarkReadIcon />}
        </IconButton>

        <IconButton
          onClick={handleToggleImportant}
          size="small"
          color={email.isImportant ? 'warning' : 'default'}
          title={
            email.isImportant ? 'Remove from important' : 'Mark as important'
          }
        >
          {email.isImportant ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>

        <IconButton
          onClick={handleDelete}
          size="small"
          color="error"
          disabled={deleteEmail.isPending}
          title="Delete email"
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Email Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Subject */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          {email.subject}
        </Typography>

        {/* Sender Info */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: email.isImportant ? 'warning.main' : 'primary.main',
              width: 48,
              height: 48,
            }}
          >
            {getInitials(email.from)}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {email.from}
              </Typography>
              {email.direction === 'outgoing' && (
                <Chip
                  label="Sent"
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              To: {email.to}
            </Typography>

            {email.cc && (
              <Typography variant="body2" color="text.secondary">
                Cc: {email.cc}
              </Typography>
            )}

            {email.bcc && (
              <Typography variant="body2" color="text.secondary">
                Bcc: {email.bcc}
              </Typography>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              {formatDateLong(email.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Body */}
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
          }}
        >
          {email.content || 'No content'}
        </Typography>
      </Box>
    </Box>
  );
}
